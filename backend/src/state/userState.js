import prisma from '../db/prisma.js';
import { redis } from '../db/redis.js';

const ONE_HOUR = 3600;
const TWENTY_FOUR_HOURS = 86400;

export async function getUserStats(userId) {
  const now = Date.now();
  const oneHourAgo = now - ONE_HOUR * 1000;
  const oneDayAgo = now - TWENTY_FOUR_HOURS * 1000;

  const txKey = `user:${userId}:txs`;

  // Upstash: zrangebyscore returns array of members
  const recentTxJson = await redis.zrangeByScore(txKey, oneHourAgo, now);
  const recentTxs = (recentTxJson || [])
    .map(t => { try { return typeof t === 'string' ? JSON.parse(t) : t; } catch { return null; } })
    .filter(Boolean);

  const dayTxJson = await redis.zrangeByScore(txKey, oneDayAgo, now);
  const dayTxs = (dayTxJson || [])
    .map(t => { try { return typeof t === 'string' ? JSON.parse(t) : t; } catch { return null; } })
    .filter(Boolean);

  return {
    transactions_last_hour: recentTxs.length,
    countries_last_hour:    new Set(recentTxs.map(t => t.country).filter(Boolean)).size,
    devices_last_hour:      new Set(recentTxs.map(t => t.device_id).filter(Boolean)).size,
    volume_last_24h:        dayTxs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
  };
}

export async function recordTransactionInWindow(userId, transaction) {
  const now = Date.now();
  const txKey = `user:${userId}:txs`;
  const twoHoursAgo = now - 2 * 3600 * 1000;

  const payload = JSON.stringify({
    id:        transaction.id,
    amount:    transaction.amount,
    country:   transaction.country,
    device_id: transaction.device_id,
    ts:        now,
  });

  // Upstash zadd syntax: zadd(key, { score, member })
  await redis.zadd(txKey, { score: now, member: payload });
  await redis.zremrangebyscore(txKey, 0, twoHoursAgo);
  await redis.expire(txKey, TWENTY_FOUR_HOURS);
}

export async function isDuplicateTransaction(transactionId) {
  const key = `dedup:${transactionId}`;
  const exists = await redis.get(key);
  if (exists) return true;
  // Upstash set with expiry: set(key, value, { ex: seconds })
  await redis.set(key, '1', { ex: TWENTY_FOUR_HOURS });
  return false;
}

export async function getUserById(userId) {
  return await prisma.user.findUnique({ where: { id: userId } });
}

export async function updateUserStats(userId, { riskScore, status, amount }) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      risk_score:         riskScore,
      total_transactions: { increment: 1 },
      total_volume:       { increment: amount },
      flagged_count:      { increment: status === 'FLAGGED' ? 1 : 0 },
      blocked_count:      { increment: status === 'BLOCKED' ? 1 : 0 },
    },
  });
}

export async function setUserFrozen(userId, frozen) {
  await prisma.user.update({
    where: { id: userId },
    data: { is_frozen: frozen },
  });
  await redis.del(`user:${userId}:frozen`);
}