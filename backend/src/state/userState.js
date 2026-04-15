import prisma from '../db/prisma.js';
import { redis } from '../db/redis.js';

const ONE_HOUR = 3600;
const TWENTY_FOUR_HOURS = 86400;

// -----------------------------
// GET USER STATS (Sliding Window)
// -----------------------------
export async function getUserStats(userId) {
  const now = Date.now();
  const oneHourAgo = now - ONE_HOUR * 1000;
  const oneDayAgo = now - TWENTY_FOUR_HOURS * 1000;

  const txKey = `user:${userId}:txs`;

  let recentTxJson = [];
  let dayTxJson = [];

  try {
    // ✅ Upstash correct usage
    recentTxJson = await redis.zrange(
      txKey,
      oneHourAgo,
      now,
      { byScore: true }
    );

    dayTxJson = await redis.zrange(
      txKey,
      oneDayAgo,
      now,
      { byScore: true }
    );

  } catch (err) {
    console.error("Redis error (getUserStats):", err);

    return {
      transactions_last_hour: 0,
      countries_last_hour: 0,
      devices_last_hour: 0,
      volume_last_24h: 0,
    };
  }

  // ✅ Parse safely
  const parse = (arr) =>
    (arr || [])
      .map((t) => {
        try {
          return typeof t === "string" ? JSON.parse(t) : t;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

  const recentTxs = parse(recentTxJson);
  const dayTxs = parse(dayTxJson);

  return {
    transactions_last_hour: recentTxs.length,
    countries_last_hour: new Set(
      recentTxs.map((t) => t.country).filter(Boolean)
    ).size,
    devices_last_hour: new Set(
      recentTxs.map((t) => t.device_id).filter(Boolean)
    ).size,
    volume_last_24h: dayTxs.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0
    ),
  };
}

// -----------------------------
// RECORD TRANSACTION (Sliding Window)
// -----------------------------
export async function recordTransactionInWindow(userId, transaction) {
  const now = Date.now();
  const txKey = `user:${userId}:txs`;
  const twoHoursAgo = now - 2 * 3600 * 1000;

  const payload = JSON.stringify({
    id: transaction.id,
    amount: transaction.amount,
    country: transaction.country,
    device_id: transaction.device_id,
    ts: now,
  });

  try {
    // ✅ Add transaction
    await redis.zadd(txKey, {
      score: now,
      member: payload,
    });

    // ✅ Remove old data (IMPORTANT FIX)
    await redis.zremrangebyscore(txKey, 0, twoHoursAgo);

    // ✅ Set expiry
    await redis.expire(txKey, TWENTY_FOUR_HOURS);

  } catch (err) {
    console.error("Redis error (recordTransaction):", err);
  }
}

// -----------------------------
// DUPLICATE CHECK
// -----------------------------
export async function isDuplicateTransaction(transactionId) {
  const key = `dedup:${transactionId}`;

  try {
    const exists = await redis.get(key);
    if (exists) return true;

    // ✅ Upstash set with expiry
    await redis.set(key, "1", { ex: TWENTY_FOUR_HOURS });

    return false;

  } catch (err) {
    console.error("Redis error (dedup):", err);
    return false; // fail-safe
  }
}

// -----------------------------
// DB FUNCTIONS (PRISMA)
// -----------------------------
export async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function updateUserStats(userId, { riskScore, status, amount }) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      risk_score: riskScore,
      total_transactions: { increment: 1 },
      total_volume: { increment: amount },
      flagged_count: { increment: status === 'FLAGGED' ? 1 : 0 },
      blocked_count: { increment: status === 'BLOCKED' ? 1 : 0 },
    },
  });
}

export async function setUserFrozen(userId, frozen) {
  await prisma.user.update({
    where: { id: userId },
    data: { is_frozen: frozen },
  });

  try {
    await redis.del(`user:${userId}:frozen`);
  } catch (err) {
    console.error("Redis error (setUserFrozen):", err);
  }
}