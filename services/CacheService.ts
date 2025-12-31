/**
 * Cache Service
 * Provides high-level caching functionality for application data
 * Phase 6 - Performance & Scalability
 */

import redis from '../utils/redis';
import logger from '../utils/logger';

// Cache TTL configurations (in seconds)
export const TTL = {
  AIRPORTS: 60 * 60 * 24, // 24 hours (static data)
  USER_TRIPS: 60 * 5, // 5 minutes
  TRIP_DETAILS: 60 * 5, // 5 minutes
  USER_COMPANIONS: 60 * 5, // 5 minutes
  USER_VOUCHERS: 60 * 5, // 5 minutes
  TRIP_STATS: 60 * 10, // 10 minutes
  SHORT: 60, // 1 minute
  MEDIUM: 60 * 15, // 15 minutes
  LONG: 60 * 60, // 1 hour
};

/**
 * Generate cache key for airports search
 */
function airportSearchKey(query: string, limit: number): string {
  return `airports:search:${query.toLowerCase()}:${limit}`;
}

/**
 * Generate cache key for airport by code
 */
function airportCodeKey(code: string): string {
  return `airports:code:${code.toUpperCase()}`;
}

/**
 * Generate cache key for user trips
 */
function userTripsKey(userId: string, filter: string = 'upcoming', page: number = 1): string {
  return `user:${userId}:trips:${filter}:${page}`;
}

/**
 * Generate cache key for trip details
 */
function tripDetailsKey(tripId: string): string {
  return `trip:${tripId}:details`;
}

/**
 * Generate cache key for user companions
 */
function userCompanionsKey(userId: string): string {
  return `user:${userId}:companions`;
}

/**
 * Generate cache key for user vouchers
 */
function userVouchersKey(userId: string, filters: Record<string, any> = {}): string {
  const filterStr = JSON.stringify(filters);
  return `user:${userId}:vouchers:${Buffer.from(filterStr).toString('base64')}`;
}

/**
 * Generate cache key for trip statistics
 */
function tripStatsKey(userId: string): string {
  return `user:${userId}:tripStats`;
}

/**
 * Cache airport search results
 */
export async function cacheAirportSearch(query: string, limit: number, airports: any[]): Promise<boolean> {
  const key = airportSearchKey(query, limit);
  return redis.set(key, airports, TTL.AIRPORTS);
}

/**
 * Get cached airport search results
 */
export async function getCachedAirportSearch(query: string, limit: number): Promise<any[] | null> {
  const key = airportSearchKey(query, limit);
  return redis.get(key);
}

/**
 * Cache airport by code
 */
export async function cacheAirportByCode(code: string, airport: any): Promise<boolean> {
  const key = airportCodeKey(code);
  return redis.set(key, airport, TTL.AIRPORTS);
}

/**
 * Get cached airport by code
 */
export async function getCachedAirportByCode(code: string): Promise<any | null> {
  const key = airportCodeKey(code);
  return redis.get(key);
}

/**
 * Cache user trips
 */
export async function cacheUserTrips(userId: string, filter: string, page: number, data: any): Promise<boolean> {
  const key = userTripsKey(userId, filter, page);
  return redis.set(key, data, TTL.USER_TRIPS);
}

/**
 * Get cached user trips
 */
export async function getCachedUserTrips(userId: string, filter: string, page: number): Promise<any | null> {
  const key = userTripsKey(userId, filter, page);
  return redis.get(key);
}

/**
 * Invalidate all cached trips for a user
 */
export async function invalidateUserTrips(userId: string): Promise<number> {
  const pattern = `user:${userId}:trips:*`;
  const count = await redis.deletePattern(pattern);
  logger.debug('Invalidated user trips cache', { userId, count });
  return count;
}

/**
 * Cache trip details
 */
export async function cacheTripDetails(tripId: string, trip: any): Promise<boolean> {
  const key = tripDetailsKey(tripId);
  return redis.set(key, trip, TTL.TRIP_DETAILS);
}

/**
 * Get cached trip details
 */
export async function getCachedTripDetails(tripId: string): Promise<any | null> {
  const key = tripDetailsKey(tripId);
  return redis.get(key);
}

/**
 * Invalidate cached trip details
 */
export async function invalidateTripDetails(tripId: string): Promise<boolean> {
  const key = tripDetailsKey(tripId);
  return redis.del(key);
}

/**
 * Cache user companions
 */
export async function cacheUserCompanions(userId: string, companions: any[]): Promise<boolean> {
  const key = userCompanionsKey(userId);
  return redis.set(key, companions, TTL.USER_COMPANIONS);
}

/**
 * Get cached user companions
 */
export async function getCachedUserCompanions(userId: string): Promise<any[] | null> {
  const key = userCompanionsKey(userId);
  return redis.get(key);
}

/**
 * Invalidate user companions cache
 */
export async function invalidateUserCompanions(userId: string): Promise<boolean> {
  const key = userCompanionsKey(userId);
  return redis.del(key);
}

/**
 * Cache user vouchers
 */
export async function cacheUserVouchers(userId: string, filters: Record<string, any>, vouchers: any[]): Promise<boolean> {
  const key = userVouchersKey(userId, filters);
  return redis.set(key, vouchers, TTL.USER_VOUCHERS);
}

/**
 * Get cached user vouchers
 */
export async function getCachedUserVouchers(userId: string, filters: Record<string, any>): Promise<any[] | null> {
  const key = userVouchersKey(userId, filters);
  return redis.get(key);
}

/**
 * Invalidate all cached vouchers for a user
 */
export async function invalidateUserVouchers(userId: string): Promise<number> {
  const pattern = `user:${userId}:vouchers:*`;
  return redis.deletePattern(pattern);
}

/**
 * Cache trip statistics
 */
export async function cacheTripStats(userId: string, stats: any): Promise<boolean> {
  const key = tripStatsKey(userId);
  return redis.set(key, stats, TTL.TRIP_STATS);
}

/**
 * Get cached trip statistics
 */
export async function getCachedTripStats(userId: string): Promise<any | null> {
  const key = tripStatsKey(userId);
  return redis.get(key);
}

/**
 * Invalidate trip statistics
 */
export async function invalidateTripStats(userId: string): Promise<boolean> {
  const key = tripStatsKey(userId);
  return redis.del(key);
}

/**
 * Invalidate all user-related caches
 */
export async function invalidateAllUserCaches(userId: string): Promise<number> {
  const pattern = `user:${userId}:*`;
  const count = await redis.deletePattern(pattern);
  logger.info('Invalidated all user caches', { userId, count });
  return count;
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpUserCache(userId: string, services: any): Promise<void> {
  try {
    // Cache user trips (upcoming)
    if (services.tripService) {
      const trips = await services.tripService.getUserTrips(userId, { filter: 'upcoming' });
      await cacheUserTrips(userId, 'upcoming', 1, trips);
    }

    // Cache user companions
    if (services.companionService) {
      const companions = await services.companionService.getUserCompanions(userId);
      await cacheUserCompanions(userId, companions);
    }

    // Cache trip statistics
    if (services.tripService) {
      const stats = await services.tripService.getTripStatistics(userId);
      await cacheTripStats(userId, stats);
    }

    logger.info('Cache warmed up for user', { userId });
  } catch (error) {
    logger.error('Failed to warm up cache', { userId, error: (error as Error).message });
  }
}

/**
 * Invalidate all airport caches
 */
export async function invalidateAirportCaches(): Promise<number> {
  const pattern = 'airports:*';
  const count = await redis.deletePattern(pattern);
  logger.info('Invalidated all airport caches', { count });
  return count;
}

export default {
  TTL,
  // Airport caching
  cacheAirportSearch,
  getCachedAirportSearch,
  cacheAirportByCode,
  getCachedAirportByCode,
  invalidateAirportCaches,
  // Trip caching
  cacheUserTrips,
  getCachedUserTrips,
  invalidateUserTrips,
  cacheTripDetails,
  getCachedTripDetails,
  invalidateTripDetails,
  // Companion caching
  cacheUserCompanions,
  getCachedUserCompanions,
  invalidateUserCompanions,
  // Voucher caching
  cacheUserVouchers,
  getCachedUserVouchers,
  invalidateUserVouchers,
  // Statistics caching
  cacheTripStats,
  getCachedTripStats,
  invalidateTripStats,
  // Utility
  invalidateAllUserCaches,
  warmUpUserCache,
};
