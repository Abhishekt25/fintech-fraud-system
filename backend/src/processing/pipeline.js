import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { evaluateTransaction, computeUserRiskScore } from '../rules/engine.js';
import {
  getUserStats,
  recordTransactionInWindow,
  isDuplicateTransaction,
  getUserById,
  updateUserStats,
} from '../state/userState.js';
import { broadcast } from '../websocket/manager.js';

let sessionStats = {
  live: 0,
  total: 0,
  flagged: 0,
  blocked: 0,
  volume: 0,
};

export function getSessionStats() {
  return { ...sessionStats };
}

export function resetSessionStats() {
  sessionStats = { live: 0, total: 0, flagged: 0, blocked: 0, volume: 0 };
}

export async function processTransaction(txData) {
  const txId = txData.id || uuidv4();

  // Step 1: Deduplication
  const duplicate = await isDuplicateTransaction(txId);
  if (duplicate) {
    console.log(`Duplicate transaction ignored: ${txId}`);
    return { success: false, reason: 'DUPLICATE', transactionId: txId };
  }

  // Step 2: Validate user exists
  const user = await getUserById(txData.user_id);
  if (!user) {
    return { success: false, reason: 'USER_NOT_FOUND' };
  }

  // Step 3: Check if user is frozen
  if (user.is_frozen) {
    const frozenEvaluation = {
      status: 'BLOCKED',
      riskScore: 100,
      matchedRules: [{ name: 'Frozen Account', action: 'BLOCK', weight: 100 }],
    };
    const tx = await saveTransaction(txId, txData, frozenEvaluation);
    await broadcastTransaction(tx, user);
    return { success: true, transaction: tx, reason: 'USER_FROZEN' };
  }

  // Step 4: Get user stats for rule evaluation
  const userStats = await getUserStats(txData.user_id);

  // Step 5: Evaluate rules
  const evaluation = await evaluateTransaction(txData, user, userStats);

  // Step 6: Compute new user risk score
  const newRiskScore = computeUserRiskScore(
    parseFloat(user.risk_score || 0),
    evaluation.riskScore,
    evaluation.status
  );

  // Step 7: Save transaction to DB
  const tx = await saveTransaction(txId, txData, evaluation);

  // Step 8: Update user stats
  await updateUserStats(txData.user_id, {
    riskScore: newRiskScore,
    status: evaluation.status,
    amount: parseFloat(txData.amount),
  });

  // Step 9: Record in sliding window
  await recordTransactionInWindow(txData.user_id, { ...txData, id: txId });

  // Step 10: Update session stats
  sessionStats.total++;
  sessionStats.live++;
  sessionStats.volume += parseFloat(txData.amount);
  if (evaluation.status === 'FLAGGED') sessionStats.flagged++;
  if (evaluation.status === 'BLOCKED') sessionStats.blocked++;

  // Step 11: Fetch updated user for broadcast
  const updatedUser = await getUserById(txData.user_id);

  // Step 12: Broadcast via WebSocket
  await broadcastTransaction(tx, updatedUser);

  broadcast('USER_UPDATED', formatUserForBroadcast(updatedUser));
  broadcast('STATS_UPDATED', {
    ...sessionStats,
    flagRate: sessionStats.total > 0
      ? Math.round(((sessionStats.flagged + sessionStats.blocked) / sessionStats.total) * 100)
      : 0,
  });

  return { success: true, transaction: tx };
}

async function saveTransaction(txId, txData, evaluation) {
  return await prisma.transaction.create({
    data: {
      id:           txId,
      user_id:      txData.user_id,
      amount:       txData.amount,
      merchant:     txData.merchant,
      category:     txData.category || 'general',
      country:      txData.country  || 'US',
      device_id:    txData.device_id  || null,
      ip_address:   txData.ip_address || null,
      status:       evaluation.status,
      risk_score:   evaluation.riskScore,
      flagged_rules: evaluation.matchedRules,
      processed_at: new Date(),
    },
  });
}

async function broadcastTransaction(tx, user) {
  broadcast('TRANSACTION', {
    ...tx,
    // Prisma Decimal → plain number
    amount:     parseFloat(tx.amount),
    risk_score: parseFloat(tx.risk_score),
    user_name:  user?.name  || 'Unknown',
    user_email: user?.email || '',
    flagged_rules: Array.isArray(tx.flagged_rules)
      ? tx.flagged_rules
      : JSON.parse(tx.flagged_rules || '[]'),
  });
}

function formatUserForBroadcast(user) {
  return {
    id:                 user.id,
    name:               user.name,
    email:              user.email,
    risk_score:         parseFloat(user.risk_score  || 0),
    is_frozen:          user.is_frozen,
    total_transactions: user.total_transactions,
    total_volume:       parseFloat(user.total_volume || 0),
    flagged_count:      user.flagged_count,
    blocked_count:      user.blocked_count,
  };
}