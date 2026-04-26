import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts, giving up');
        return new Error('Redis reconnection failed');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, etc.
      return Math.min(retries * 50, 3000);
    },
  },
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Connect to Redis
let isConnected = false;

export const connectRedis = async () => {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Don't throw - allow app to run without Redis (degraded mode)
    }
  }
};

// Cache utility functions
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!isConnected) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache with expiration (in seconds)
   */
  async set(key: string, value: any, expirationSeconds: number): Promise<void> {
    try {
      if (!isConnected) return;
      await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (!isConnected) return;
      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!isConnected) return false;
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<void> {
    try {
      if (!isConnected) return;
      await redisClient.flushAll();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  },
};

export default redisClient;
