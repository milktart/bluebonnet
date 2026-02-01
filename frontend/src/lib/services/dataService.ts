/**
 * Data Service - Live data loading (no caching)
 *
 * Manages:
 * - Always fetch fresh data from database
 * - Batch fetching with concurrency limits
 * - Cross-tab data synchronization
 * - Broadcast of data changes
 *
 * Usage:
 * import { dataService } from '$lib/services/dataService';
 *
 * // Always fetches fresh data
 * const trips = await dataService.loadAllTrips();
 *
 * // Broadcast change
 * dataService.broadcastDataChange('trip:created', { id: '123', name: 'Paris' });
 */

import { dashboardStore, dashboardStoreActions } from '$lib/stores/dashboardStore.js';
import { tripsApi } from '$lib/services/api.js';
import type { Trip, Flight, Hotel, Event, CarRental, Transportation } from '../../../types/index.js';

/**
 * Cache entry with TTL (Time To Live)
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Data Service class
 * Singleton instance handles all data loading and caching
 */
class DataService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly MAX_CONCURRENT_REQUESTS = 5;

  /**
   * Load all trips with fresh data from database
   *
   * - Always fetches fresh data for all trips + details in parallel
   * - Updates the dashboard store with current data
   *
   * @returns Array of trips with full details
   * @throws Error if fetch fails
   *
   * @example
   * const trips = await dataService.loadAllTrips();
   */
  async loadAllTrips(): Promise<Trip[]> {
    dashboardStoreActions.setLoading(true);
    try {
      // Always fetch fresh data from database (no caching)
      const response = await tripsApi.getAll('all');
      const trips = response?.trips || [];

      // Fetch detailed data for each trip in parallel with concurrency limit
      const detailed = await this.fetchInBatches(
        trips,
        (trip) => tripsApi.getOne(trip.id),
        this.MAX_CONCURRENT_REQUESTS
      );

      // Update dashboard store
      dashboardStoreActions.setTrips(detailed);

      return detailed;
    } catch (error) {
      dashboardStoreActions.setError(
        error instanceof Error ? error.message : 'Failed to load trips'
      );
      throw error;
    } finally {
      dashboardStoreActions.setLoading(false);
    }
  }

  /**
   * Load standalone items with caching
   *
   * @param filter - 'upcoming', 'past', or 'all'
   * @returns Object with flights, hotels, events, etc.
   *
   * @example
   * const items = await dataService.loadStandaloneItems('upcoming');
   */
  async loadStandaloneItems(
    filter: 'upcoming' | 'past' | 'all' = 'all'
  ): Promise<{
    flights: Flight[];
    hotels: Hotel[];
    events: Event[];
    carRentals: CarRental[];
    transportation: Transportation[];
  }> {
    // Always fetch fresh data from database (no caching)
    const response = await tripsApi.getAll(filter);
    const items = response?.standalone || {
      flights: [],
      hotels: [],
      events: [],
      carRentals: [],
      transportation: [],
    };

    // Update store
    dashboardStoreActions.setStandaloneItems(items);

    return items;
  }

  /**
   * Load single trip with details
   *
   * @param tripId - ID of trip to load
   * @returns Trip with all relationships populated
   *
   * @example
   * const trip = await dataService.loadTripDetails('trip-123');
   */
  async loadTripDetails(tripId: string): Promise<Trip> {
    // Always fetch fresh data from database (no caching)
    const trip = await tripsApi.getOne(tripId);
    return trip;
  }

  /**
   * No-op: Cache invalidation not needed since no caching is used
   *
   * @deprecated Cache is disabled - data is always fetched fresh from the database
   */
  invalidateCache(itemType: 'trip' | 'item' | 'all' = 'all') {
    // No-op: no caching is used, so invalidation is not needed
  }

  /**
   * Broadcast data change to all tabs/windows
   *
   * Triggers listeners in other dashboard instances via window event
   * Used to synchronize data across multiple browser tabs
   *
   * @param type - Type of change (e.g., 'trip:created', 'item:updated')
   * @param data - Data associated with the change
   *
   * @example
   * // After creating a trip
   * dataService.broadcastDataChange('trip:created', {
   *   id: 'trip-123',
   *   name: 'Paris Vacation'
   * });
   *
   * // Listen for changes (in +page.svelte onMount)
   * window.addEventListener('dataChanged', (e: any) => {
   *   const { type, data } = e.detail;
   *   if (type.includes('trip')) {
   *     dataService.invalidateCache('trip');
   *     await dataService.loadAllTrips(true); // Force refresh
   *   }
   * });
   */
  broadcastDataChange(
    type:
      | 'trip:created'
      | 'trip:updated'
      | 'trip:deleted'
      | 'item:created'
      | 'item:updated'
      | 'item:deleted'
      | 'companion:added'
      | 'companion:removed',
    data: Record<string, any>
  ) {
    const event = new CustomEvent('dataChanged', {
      detail: { type, data, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }

  /**
   * HELPER METHODS
   */

  /**
   * Fetch items in batches with concurrency limit
   *
   * Prevents overwhelming server with too many parallel requests
   * Ensures proper error handling and partial success
   *
   * @param items - Array of items to fetch
   * @param fetcher - Function to fetch each item
   * @param batchSize - Max concurrent requests
   * @returns Array of fetched results (with fallback to original if fetch fails)
   *
   * @example
   * const results = await dataService.fetchInBatches(
   *   trips,
   *   trip => api.getOne(trip.id),
   *   5 // Max 5 concurrent
   * );
   */
  private async fetchInBatches<T, R>(
    items: T[],
    fetcher: (item: T) => Promise<R>,
    batchSize: number
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Fetch batch with Promise.allSettled for partial success
      const batchResults = await Promise.allSettled(batch.map((item) => fetcher(item)));

      // Process results
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // On error, fallback to original item
          results.push(items[i + idx] as any);
        }
      });
    }

    return results;
  }

  /**
   * Clear any remaining cache (for logout)
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Singleton instance
 * Use this across the application
 */
export const dataService = new DataService();

/**
 * SETUP HELPER - DEPRECATED
 *
 * This function is no longer needed - listeners are registered directly in +page.svelte
 * Kept for backwards compatibility but does nothing.
 */
export function setupDataSyncListener() {
  // No-op: listeners are registered in +page.svelte onMount instead
}

/**
 * TYPES FOR EXTERNAL USE
 */

export interface CacheStats {
  size: number;
  entries: Array<{
    key: string;
    ageMs: number;
    ttlMs: number;
    expired: boolean;
  }>;
  totalSize: number;
}
