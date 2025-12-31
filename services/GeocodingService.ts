/**
 * Geocoding Service
 * Handles geocoding and reverse geocoding operations
 */

import axios from 'axios';
import * as http from 'http';
import * as https from 'https';
import logger from '../utils/logger';
import { MS_PER_MINUTE } from '../utils/constants';

// Load version from package.json
const packageJson = require('../package.json') as any;
const version = packageJson.version;

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeoData {
  country_code: string;
  timezone: string;
}

interface DiagnosticsInfo {
  circuitState: string;
  failureCount: number;
  concurrentRequests: number;
  cacheSize: number;
  timeout: number;
  maxRetries: number;
  maxConcurrentRequests: number;
  circuitBreakerThreshold: number;
}

// Configuration
const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const GEOCODING_TIMEOUT = parseInt(process.env.GEOCODING_TIMEOUT || '', 10) || 5000;
const MIN_REQUEST_INTERVAL = parseInt(process.env.GEOCODING_RATE_LIMIT || '', 10) || 100;
const USER_AGENT = `TravelPlannerApp/${version}`;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 100;
const MAX_RETRY_DELAY = 2000;
const FAILURE_CACHE_TTL = 60000;
const SUCCESS_CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CONCURRENT_REQUESTS = 2;
const CIRCUIT_BREAKER_THRESHOLD = 10;
const CIRCUIT_BREAKER_TIMEOUT = 30000;

// Connection pooling for HTTP/HTTPS
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 5,
  maxFreeSockets: 2,
  timeout: 30000,
} as any);

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 5,
  maxFreeSockets: 2,
  timeout: 30000,
} as any);

// Cache with TTL support
const geocodeCache = new Map<string, { data: any; timestamp: number; success: boolean }>();

// Circuit breaker state
let circuitState: 'closed' | 'open' | 'half-open' = 'closed';
let failureCount = 0;
let lastCircuitOpenTime = 0;

// Request queue management
let concurrentRequests = 0;
const requestQueue: any[] = [];

/**
 * Check circuit breaker state and potentially reset it
 */
function updateCircuitBreaker(): void {
  if (circuitState === 'open') {
    const timeSinceOpen = Date.now() - lastCircuitOpenTime;
    if (timeSinceOpen > CIRCUIT_BREAKER_TIMEOUT) {
      logger.info('Circuit breaker transitioning to half-open');
      circuitState = 'half-open';
      failureCount = 0;
    }
  }
}

/**
 * Get cache entry with TTL validation
 */
function getCachedResult(key: string): any {
  if (!geocodeCache.has(key)) {
    return null;
  }

  const entry = geocodeCache.get(key);
  if (!entry) return null;

  // Check if cache entry is still valid
  if (entry.timestamp) {
    const ttl = entry.success ? SUCCESS_CACHE_TTL : FAILURE_CACHE_TTL;
    if (Date.now() - entry.timestamp > ttl) {
      geocodeCache.delete(key);
      return null;
    }
  }

  return entry.data;
}

/**
 * Set cache entry with metadata
 */
function setCacheEntry(key: string, data: any, success: boolean = true): void {
  geocodeCache.set(key, {
    data,
    timestamp: Date.now(),
    success,
  });
}

/**
 * Queue request with concurrency control
 */
async function executeWithConcurrencyControl<T>(fn: () => Promise<T>): Promise<T> {
  while (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  concurrentRequests += 1;
  try {
    return await fn();
  } finally {
    concurrentRequests -= 1;
  }
}

/**
 * Retry logic with exponential backoff
 */
async function executeWithRetry<T>(fn: () => Promise<T>, location: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn();
      // Reset circuit breaker on success
      if (circuitState !== 'closed') {
        logger.info('Circuit breaker closing after successful request');
        circuitState = 'closed';
        failureCount = 0;
      }
      return result;
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      // Log retry
      if (!isLastAttempt) {
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
        logger.warn(
          `Geocoding retry ${attempt}/${MAX_RETRIES} for "${location}" after ${(error as Error).message}, waiting ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Final attempt failed
        logger.error(
          `Geocoding failed after ${MAX_RETRIES} attempts for "${location}":`,
          (error as Error).message
        );

        // Update circuit breaker
        failureCount += 1;
        if (failureCount >= CIRCUIT_BREAKER_THRESHOLD && circuitState === 'closed') {
          logger.error(`Circuit breaker opening after ${failureCount} consecutive failures`);
          circuitState = 'open';
          lastCircuitOpenTime = Date.now();
        }

        throw error;
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts`);
}

/**
 * Geocode a location name to coordinates using Nominatim (OpenStreetMap)
 */
export async function geocodeLocation(locationName: string): Promise<Coordinates | null> {
  if (!locationName || typeof locationName !== 'string') {
    return null;
  }

  const trimmedLocation = locationName.trim();
  if (!trimmedLocation) {
    return null;
  }

  // Check cache first
  const cached = getCachedResult(trimmedLocation);
  if (cached !== null) {
    logger.debug(`Geocoding cache hit for: ${trimmedLocation}`);
    return cached;
  }

  // Check circuit breaker
  updateCircuitBreaker();
  if (circuitState === 'open') {
    logger.warn(`Circuit breaker is open, skipping geocoding request for: ${trimmedLocation}`);
    setCacheEntry(trimmedLocation, null, false);
    return null;
  }

  try {
    logger.debug(`Geocoding: ${trimmedLocation}`);

    let result: Coordinates | null = null;
    await executeWithConcurrencyControl(async () => {
      result = await executeWithRetry(async () => {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
          params: {
            format: 'json',
            q: trimmedLocation,
            limit: 1,
          },
          headers: {
            'User-Agent': USER_AGENT,
          },
          timeout: GEOCODING_TIMEOUT,
          httpAgent,
          httpsAgent,
        });

        if (response.data && response.data.length > 0) {
          const geoResult = response.data[0];
          const coords: Coordinates = {
            lat: parseFloat(geoResult.lat),
            lng: parseFloat(geoResult.lon),
          };
          logger.info(`Geocoded ${trimmedLocation} to:`, coords);
          return coords;
        }

        logger.debug(`No geocoding results for: ${trimmedLocation}`);
        return null;
      }, trimmedLocation);
    });

    // Cache the result
    setCacheEntry(trimmedLocation, result, result !== null);
    return result;
  } catch (error) {
    logger.error(`Geocoding error for "${trimmedLocation}":`, (error as Error).message);
    setCacheEntry(trimmedLocation, null, false);
    return null;
  }
}

/**
 * Clear the geocoding cache
 */
export function clearCache(): void {
  geocodeCache.clear();
  logger.info('Geocoding cache cleared');
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return geocodeCache.size;
}

/**
 * Reverse geocode coordinates to get location info including country
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoData | null> {
  if (!lat || !lng) {
    return null;
  }

  const cacheKey = `reverse_${lat}_${lng}`;
  const cached = getCachedResult(cacheKey);
  if (cached !== null) {
    logger.debug(`Reverse geocoding cache hit for: ${lat}, ${lng}`);
    return cached;
  }

  // Check circuit breaker
  updateCircuitBreaker();
  if (circuitState === 'open') {
    logger.warn(`Circuit breaker is open, skipping reverse geocoding request for: ${lat}, ${lng}`);
    setCacheEntry(cacheKey, null, false);
    return null;
  }

  try {
    logger.debug(`Reverse geocoding: ${lat}, ${lng}`);

    let result: GeoData | null = null;
    await executeWithConcurrencyControl(async () => {
      result = await executeWithRetry(async () => {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
          params: {
            format: 'json',
            lat,
            lon: lng,
          },
          headers: {
            'User-Agent': USER_AGENT,
          },
          timeout: GEOCODING_TIMEOUT,
          httpAgent,
          httpsAgent,
        });

        if (response.data && response.data.address) {
          const countryCode = response.data.address.country_code?.toUpperCase();
          const geoResult: GeoData = {
            country_code: countryCode,
            timezone: getTimezoneForCountry(countryCode, lat, lng),
          };
          logger.info(`Reverse geocoded (${lat}, ${lng}) to country: ${countryCode}`);
          return geoResult;
        }

        logger.debug(`No reverse geocoding results for: ${lat}, ${lng}`);
        return null;
      }, `${lat},${lng}`);
    });

    setCacheEntry(cacheKey, result, result !== null);
    return result;
  } catch (error) {
    logger.error(`Reverse geocoding error for (${lat}, ${lng}):`, (error as Error).message);
    setCacheEntry(cacheKey, null, false);
    return null;
  }
}

/**
 * Infer timezone from latitude/longitude
 */
export async function inferTimezone(lat: number, lng: number): Promise<string | null> {
  if (!lat || !lng) {
    return null;
  }

  try {
    const geoData = await reverseGeocode(lat, lng);
    return geoData?.timezone || null;
  } catch (error) {
    logger.error('Error inferring timezone:', error);
    return null;
  }
}

/**
 * Map country code to timezone
 */
export function getTimezoneForCountry(countryCode: string, lat?: number, lng?: number): string {
  // Special handling for US
  if (countryCode === 'US' && lng !== undefined) {
    return getUSTimezone(lat || 0, lng);
  }

  // Country code to primary timezone mapping
  const countryTimezones: { [key: string]: string } = {
    CA: 'America/Toronto',
    MX: 'America/Mexico_City',
    BR: 'America/Sao_Paulo',
    AR: 'America/Argentina/Buenos_Aires',
    CL: 'America/Santiago',
    CO: 'America/Bogota',
    PE: 'America/Lima',
    GB: 'Europe/London',
    IE: 'Europe/Dublin',
    FR: 'Europe/Paris',
    DE: 'Europe/Berlin',
    IT: 'Europe/Rome',
    ES: 'Europe/Madrid',
    NL: 'Europe/Amsterdam',
    BE: 'Europe/Brussels',
    CH: 'Europe/Zurich',
    AT: 'Europe/Vienna',
    SE: 'Europe/Stockholm',
    NO: 'Europe/Oslo',
    DK: 'Europe/Copenhagen',
    FI: 'Europe/Helsinki',
    PL: 'Europe/Warsaw',
    CZ: 'Europe/Prague',
    RU: 'Europe/Moscow',
    JP: 'Asia/Tokyo',
    CN: 'Asia/Shanghai',
    IN: 'Asia/Kolkata',
    SG: 'Asia/Singapore',
    TH: 'Asia/Bangkok',
    MY: 'Asia/Kuala_Lumpur',
    PH: 'Asia/Manila',
    KR: 'Asia/Seoul',
    ID: 'Asia/Jakarta',
    VN: 'Asia/Ho_Chi_Minh',
    HK: 'Asia/Hong_Kong',
    AE: 'Asia/Dubai',
    SA: 'Asia/Riyadh',
    IL: 'Asia/Jerusalem',
    TR: 'Europe/Istanbul',
    ZA: 'Africa/Johannesburg',
    EG: 'Africa/Cairo',
    NG: 'Africa/Lagos',
    KE: 'Africa/Nairobi',
    AU: 'Australia/Sydney',
    NZ: 'Pacific/Auckland',
  };

  if (countryCode && countryTimezones[countryCode]) {
    return countryTimezones[countryCode];
  }

  // Fallback: estimate timezone from longitude
  if (lng !== undefined) {
    const estimatedOffset = Math.round(lng / 15);
    if (estimatedOffset >= -12 && estimatedOffset <= 12) {
      const hours = Math.abs(estimatedOffset);
      const sign = estimatedOffset >= 0 ? '+' : '-';
      return `UTC${sign}${hours}`;
    }
  }

  return 'UTC';
}

/**
 * Determine US timezone based on latitude and longitude
 */
function getUSTimezone(lat: number, lng: number): string {
  let timezone: string;

  // Handle special cases: Alaska and Hawaii
  if (lat < 30 && lng < -150) {
    timezone = 'Pacific/Honolulu';
  } else if (lat > 50 && lng < -130) {
    timezone = 'America/Anchorage';
  } else {
    // Continental US timezones based on longitude
    if (lng > -85) {
      timezone = 'America/New_York';
    } else if (lng > -90) {
      timezone = 'America/Chicago';
    } else if (lng > -105) {
      timezone = 'America/Denver';
    } else {
      timezone = 'America/Los_Angeles';
    }
  }

  logger.info(`US timezone inference: (${lat}, ${lng}) -> ${timezone}`);
  return timezone;
}

/**
 * Get diagnostic information about the geocoding service
 */
export function getDiagnostics(): DiagnosticsInfo {
  return {
    circuitState,
    failureCount,
    concurrentRequests,
    cacheSize: geocodeCache.size,
    timeout: GEOCODING_TIMEOUT,
    maxRetries: MAX_RETRIES,
    maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD,
  };
}

export default {
  geocodeLocation,
  reverseGeocode,
  inferTimezone,
  getTimezoneForCountry,
  clearCache,
  getCacheSize,
  getDiagnostics,
};
