import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// No initRedis needed for Upstash — it's HTTP-based, always ready
export async function initRedis() {
  try {
    await redis.ping();
    console.log('✓ Upstash Redis connected');
  } catch (err) {
    console.error('✗ Upstash Redis connection failed:', err.message);
    throw err;
  }
}