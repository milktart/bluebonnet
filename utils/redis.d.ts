/**
 * Redis Type Declarations
 * Redis client utility
 */

export interface RedisClient {
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: any): Promise<void>;
  del(key: string): Promise<number>;
  [key: string]: any;
}

declare const redis: {
  initRedis(): Promise<void>;
  getClient(): RedisClient | null;
  isAvailable(): boolean;
  disconnect(): Promise<void>;
};

export default redis;
