import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
    console.warn('⚠️  Redis credentials not found in .env. Caching will be disabled.');
}

export const redis = (redisUrl && redisToken)
    ? new Redis({
        url: redisUrl,
        token: redisToken,
    })
    : null;

export const isRedisEnabled = !!redis;
