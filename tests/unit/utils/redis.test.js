const redisModule = require('redis');
const redis = require('../../../utils/redis');
const logger = require('../../../utils/logger');

// Mock redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('Redis Utility', () => {
  let mockClient;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };

    // Create mock Redis client
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      incr: jest.fn(),
      incrBy: jest.fn(),
      flushDb: jest.fn(),
      isReady: true,
    };

    redisModule.createClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initRedis', () => {
    it('should initialize Redis in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const client = await redis.initRedis();

      expect(redisModule.createClient).toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('Redis initialized successfully');
      expect(client).toBe(mockClient);
    });

    it('should initialize Redis when REDIS_ENABLED is true', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REDIS_ENABLED = 'true';

      const client = await redis.initRedis();

      expect(redisModule.createClient).toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    it('should not initialize Redis in development without explicit enable', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.REDIS_ENABLED;

      const client = await redis.initRedis();

      expect(redisModule.createClient).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Redis is disabled (not in production or REDIS_ENABLED not set)'
      );
      expect(client).toBeNull();
    });

    it('should handle initialization errors gracefully', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Connection failed');
      mockClient.connect.mockRejectedValue(error);

      const client = await redis.initRedis();

      expect(logger.error).toHaveBeenCalledWith('Failed to initialize Redis', {
        error: 'Connection failed',
      });
      expect(logger.warn).toHaveBeenCalledWith('Application will continue without Redis caching');
      expect(client).toBeNull();
    });

    it('should use custom Redis configuration from environment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret';
      process.env.REDIS_DB = '2';

      await redis.initRedis();

      expect(redisModule.createClient).toHaveBeenCalledWith({
        socket: {
          host: 'redis.example.com',
          port: 6380,
        },
        password: 'secret',
        database: 2,
      });
    });
  });

  describe('getClient', () => {
    it('should return the client instance', () => {
      // Note: This test assumes the module maintains state
      const client = redis.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when client is ready', async () => {
      process.env.NODE_ENV = 'production';
      mockClient.isReady = true;

      await redis.initRedis();

      expect(redis.isAvailable()).toBe(true);
    });

    it('should return false when client is not ready', async () => {
      process.env.NODE_ENV = 'production';
      mockClient.isReady = false;

      await redis.initRedis();

      expect(redis.isAvailable()).toBe(false);
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should get and parse cached value', async () => {
      const cachedData = { id: 1, name: 'Test' };
      mockClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await redis.get('test-key');

      expect(mockClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(cachedData);
    });

    it('should return null for non-existent key', async () => {
      mockClient.get.mockResolvedValue(null);

      const result = await redis.get('missing-key');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await redis.get('error-key');

      expect(logger.error).toHaveBeenCalledWith('Redis GET error', {
        key: 'error-key',
        error: 'Redis error',
      });
      expect(result).toBeNull();
    });

    it('should return null when Redis is not available', async () => {
      mockClient.isReady = false;

      const result = await redis.get('test-key');

      expect(mockClient.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should set value without TTL', async () => {
      const data = { id: 1, name: 'Test' };
      mockClient.set.mockResolvedValue('OK');

      const result = await redis.set('test-key', data);

      expect(mockClient.set).toHaveBeenCalledWith('test-key', JSON.stringify(data));
      expect(result).toBe(true);
    });

    it('should set value with TTL', async () => {
      const data = { id: 1, name: 'Test' };
      mockClient.setEx.mockResolvedValue('OK');

      const result = await redis.set('test-key', data, 3600);

      expect(mockClient.setEx).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(data));
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockClient.set.mockRejectedValue(new Error('Redis error'));

      const result = await redis.set('error-key', { test: true });

      expect(logger.error).toHaveBeenCalledWith('Redis SET error', {
        key: 'error-key',
        error: 'Redis error',
      });
      expect(result).toBe(false);
    });

    it('should return false when Redis is not available', async () => {
      mockClient.isReady = false;

      const result = await redis.set('test-key', { test: true });

      expect(mockClient.set).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should delete a key', async () => {
      mockClient.del.mockResolvedValue(1);

      const result = await redis.del('test-key');

      expect(mockClient.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockClient.del.mockRejectedValue(new Error('Redis error'));

      const result = await redis.del('error-key');

      expect(logger.error).toHaveBeenCalledWith('Redis DEL error', {
        key: 'error-key',
        error: 'Redis error',
      });
      expect(result).toBe(false);
    });
  });

  describe('deletePattern', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should delete keys matching pattern', async () => {
      const matchingKeys = ['user:123:profile', 'user:123:settings'];
      mockClient.keys.mockResolvedValue(matchingKeys);
      mockClient.del.mockResolvedValue(2);

      const result = await redis.deletePattern('user:123:*');

      expect(mockClient.keys).toHaveBeenCalledWith('user:123:*');
      expect(mockClient.del).toHaveBeenCalledWith(matchingKeys);
      expect(result).toBe(2);
    });

    it('should return 0 when no keys match', async () => {
      mockClient.keys.mockResolvedValue([]);

      const result = await redis.deletePattern('nonexistent:*');

      expect(mockClient.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(mockClient.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await redis.deletePattern('error:*');

      expect(logger.error).toHaveBeenCalledWith('Redis DELETE PATTERN error', {
        pattern: 'error:*',
        error: 'Redis error',
      });
      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should return true when key exists', async () => {
      mockClient.exists.mockResolvedValue(1);

      const result = await redis.exists('existing-key');

      expect(mockClient.exists).toHaveBeenCalledWith('existing-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockClient.exists.mockResolvedValue(0);

      const result = await redis.exists('missing-key');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockClient.exists.mockRejectedValue(new Error('Redis error'));

      const result = await redis.exists('error-key');

      expect(logger.error).toHaveBeenCalledWith('Redis EXISTS error', {
        key: 'error-key',
        error: 'Redis error',
      });
      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should set expiration on key', async () => {
      mockClient.expire.mockResolvedValue(1);

      const result = await redis.expire('test-key', 3600);

      expect(mockClient.expire).toHaveBeenCalledWith('test-key', 3600);
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockClient.expire.mockRejectedValue(new Error('Redis error'));

      const result = await redis.expire('error-key', 3600);

      expect(logger.error).toHaveBeenCalledWith('Redis EXPIRE error', {
        key: 'error-key',
        seconds: 3600,
        error: 'Redis error',
      });
      expect(result).toBe(false);
    });
  });

  describe('incr', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should increment by 1 by default', async () => {
      mockClient.incr.mockResolvedValue(5);

      const result = await redis.incr('counter');

      expect(mockClient.incr).toHaveBeenCalledWith('counter');
      expect(result).toBe(5);
    });

    it('should increment by custom amount', async () => {
      mockClient.incrBy.mockResolvedValue(15);

      const result = await redis.incr('counter', 10);

      expect(mockClient.incrBy).toHaveBeenCalledWith('counter', 10);
      expect(result).toBe(15);
    });

    it('should handle errors gracefully', async () => {
      mockClient.incr.mockRejectedValue(new Error('Redis error'));

      const result = await redis.incr('error-counter');

      expect(logger.error).toHaveBeenCalledWith('Redis INCR error', {
        key: 'error-counter',
        amount: 1,
        error: 'Redis error',
      });
      expect(result).toBeNull();
    });
  });

  describe('getOrSet', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should return cached value on cache hit', async () => {
      const cachedData = { id: 1, name: 'Cached' };
      mockClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = jest.fn();
      const result = await redis.getOrSet('test-key', fetchFn, 3600);

      expect(mockClient.get).toHaveBeenCalledWith('test-key');
      expect(logger.debug).toHaveBeenCalledWith('Cache HIT', { key: 'test-key' });
      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch and cache on cache miss', async () => {
      const fetchedData = { id: 2, name: 'Fresh' };
      mockClient.get.mockResolvedValue(null);
      mockClient.setEx.mockResolvedValue('OK');

      const fetchFn = jest.fn().mockResolvedValue(fetchedData);
      const result = await redis.getOrSet('test-key', fetchFn, 3600);

      expect(mockClient.get).toHaveBeenCalledWith('test-key');
      expect(logger.debug).toHaveBeenCalledWith('Cache MISS', { key: 'test-key' });
      expect(fetchFn).toHaveBeenCalled();
      expect(mockClient.setEx).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(fetchedData));
      expect(result).toEqual(fetchedData);
    });

    it('should not cache null or undefined values', async () => {
      mockClient.get.mockResolvedValue(null);

      const fetchFn = jest.fn().mockResolvedValue(null);
      const result = await redis.getOrSet('test-key', fetchFn, 3600);

      expect(fetchFn).toHaveBeenCalled();
      expect(mockClient.setEx).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('flushDb', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();
    });

    it('should flush the database', async () => {
      mockClient.flushDb.mockResolvedValue('OK');

      const result = await redis.flushDb();

      expect(mockClient.flushDb).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Redis database flushed');
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockClient.flushDb.mockRejectedValue(new Error('Redis error'));

      const result = await redis.flushDb();

      expect(logger.error).toHaveBeenCalledWith('Redis FLUSHDB error', {
        error: 'Redis error',
      });
      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect the client', async () => {
      process.env.NODE_ENV = 'production';
      await redis.initRedis();

      await redis.disconnect();

      expect(mockClient.quit).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Redis client disconnected');
    });

    it('should handle disconnecting when client is null', async () => {
      await redis.disconnect();

      // Should not throw error
      expect(mockClient.quit).not.toHaveBeenCalled();
    });
  });
});
