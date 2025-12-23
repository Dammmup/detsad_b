import { redis, isRedisEnabled } from '../config/redis';

export class CacheService {
    private defaultTtl: number;

    constructor(defaultTtl: number = 3600) {
        this.defaultTtl = defaultTtl;
    }

    /**
     * Tries to get value from cache.
     * If missing, executes fetcher(), caches result, and returns it.
     */
    async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.defaultTtl): Promise<T> {
        if (!isRedisEnabled || !redis) {
            console.log(`[Cache] Redis disabled/offline, fetching ${key} from DB...`);
            return await fetcher();
        }

        try {
            const cachedData = await redis.get<T>(key);
            if (cachedData) {
                console.log(`[Cache] HIT ${key} - Returning from Redis`);
                return cachedData;
            }
        } catch (error) {
            console.warn(`Redis get error for key ${key}:`, error);
            // Fallback to fetcher on error
        }

        console.log(`[Cache] MISS ${key} - Fetching from DB...`);
        const data = await fetcher();

        if (data) {
            try {
                await redis.set(key, data, { ex: ttl });
                console.log(`[Cache] SET ${key} - Saved to Redis (TTL: ${ttl}s)`);
            } catch (error) {
                console.warn(`Redis set error for key ${key}:`, error);
            }
        }

        return data;
    }

    /**
     * Invalidates keys matching a specific pattern.
     * NOTE: Upstash/Redis SCAN can be slow for large datasets.
     * For specific entities, prefer deleting exact keys if possible,
     * or use a set to track keys for an entity.
     * 
     * Here we implement a simple pattern matching deletion.
     */
    async invalidate(pattern: string): Promise<void> {
        if (!isRedisEnabled || !redis) return;

        try {
            // Logic for pattern matching:
            // 1. Scan for keys
            // 2. Delete them
            // Note: Upstash REST API supports 'keys' command but it's generally discouraged in production for large sets.
            // However, for this scale, it might be acceptable or we iterate.

            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                console.log(`[Cache] INVALIDATE pattern: ${pattern}, keys found: ${keys.length}`);
                await redis.del(...keys);
                console.log(`[Cache] DELETED ${keys.length} keys`);
            } else {
                console.log(`[Cache] INVALIDATE pattern: ${pattern} - No keys found`);
            }
        } catch (error) {
            console.warn(`Redis invalidate error for pattern ${pattern}:`, error);
        }
    }

    /**
     * Deletes specific keys
     */
    async del(...keys: string[]): Promise<void> {
        if (!isRedisEnabled || !redis) return;
        try {
            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`[Cache] DELETED specific keys: ${keys.join(', ')}`);
            }
        } catch (error) {
            console.warn(`Redis del error:`, error);
        }
    }
}

export const cacheService = new CacheService();
