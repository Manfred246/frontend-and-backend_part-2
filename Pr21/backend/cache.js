import { createClient } from 'redis';

export const USERS_CACHE_TTL = 60;
export const PRODUCTS_CACHE_TTL = 600;

const redisClient = createClient({
  url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

export async function initRedis() {
  await redisClient.connect();
  console.log('Redis connected');
}

export function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return res.json({
          source: 'cache',
          data: JSON.parse(cachedData)
        });
      }

      req.cacheKey = key;
      req.cacheTTL = ttl;
      return next();
    } catch (err) {
      console.error('Cache read error:', err.message);
      return next();
    }
  };
}

export async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttl
    });
  } catch (err) {
    console.error('Cache save error:', err.message);
  }
}

export async function invalidateUsersCache(userId = null) {
  try {
    const keys = ['users:all'];
    if (userId) keys.push(`users:${userId}`);
    await redisClient.del(keys);
  } catch (err) {
    console.error('Users cache invalidate error:', err.message);
  }
}

export async function invalidateProductsCache(productId = null) {
  try {
    const keys = ['products:all'];
    if (productId) keys.push(`products:${productId}`);
    await redisClient.del(keys);
  } catch (err) {
    console.error('Products cache invalidate error:', err.message);
  }
}
