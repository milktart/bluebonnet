const geocodingService = require('../../../services/geocodingService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock logger
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('GeocodingService - Enhanced with Retry & Circuit Breaker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the cache between tests
    geocodingService.clearCache();
  });

  describe('geocodeLocation', () => {
    const mockResponse = {
      data: [
        {
          lat: '34.0522',
          lon: '-118.2437',
        },
      ],
    };

    it('should geocode a location successfully', async () => {
      axios.get.mockResolvedValue(mockResponse);

      const result = await geocodingService.geocodeLocation('Los Angeles, CA');

      expect(result).toEqual({
        lat: 34.0522,
        lng: -118.2437,
      });
      expect(axios.get).toHaveBeenCalled();
    });

    it('should return cached result on second request', async () => {
      axios.get.mockResolvedValue(mockResponse);

      // First request
      await geocodingService.geocodeLocation('Los Angeles, CA');

      // Second request should use cache
      const result = await geocodingService.geocodeLocation('Los Angeles, CA');

      expect(result).toBeDefined();
      expect(axios.get).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should return null for invalid location', async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await geocodingService.geocodeLocation('Invalid Location XYZ123');

      expect(result).toBeNull();
    });

    it('should return null for empty input', async () => {
      const result = await geocodingService.geocodeLocation('');

      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await geocodingService.geocodeLocation('Los Angeles');

      expect(result).toBeNull();
    });

    it('should retry failed requests with exponential backoff', async () => {
      // First 2 attempts fail, 3rd succeeds
      axios.get
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(mockResponse);

      const result = await geocodingService.geocodeLocation('Los Angeles');

      expect(result).toEqual({
        lat: 34.0522,
        lng: -118.2437,
      });
      // Should have made 3 attempts
      expect(axios.get).toHaveBeenCalledTimes(3);
    });

    it('should include httpAgent and httpsAgent for connection pooling', async () => {
      axios.get.mockResolvedValue(mockResponse);

      await geocodingService.geocodeLocation('Los Angeles');

      const callArgs = axios.get.mock.calls[0][1];
      expect(callArgs.httpAgent).toBeDefined();
      expect(callArgs.httpsAgent).toBeDefined();
    });

    it('should cache null results temporarily', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      // First call fails and caches null
      const result1 = await geocodingService.geocodeLocation('Unknown');
      expect(result1).toBeNull();

      // Second call should use cached null without calling API
      const result2 = await geocodingService.geocodeLocation('Unknown');
      expect(result2).toBeNull();
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests with concurrency control', async () => {
      axios.get.mockResolvedValue(mockResponse);

      // Make multiple concurrent requests
      const promises = [
        geocodingService.geocodeLocation('Location 1'),
        geocodingService.geocodeLocation('Location 2'),
        geocodingService.geocodeLocation('Location 3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ lat: 34.0522, lng: -118.2437 });
    });
  });

  describe('reverseGeocode', () => {
    const mockResponse = {
      data: {
        address: {
          country_code: 'us',
        },
      },
    };

    it('should reverse geocode valid coordinates', async () => {
      axios.get.mockResolvedValue(mockResponse);

      const result = await geocodingService.reverseGeocode(34.0522, -118.2437);

      expect(result).toEqual({
        country_code: 'US',
        timezone: 'America/Los_Angeles',
      });
    });

    it('should return null for invalid input', async () => {
      expect(await geocodingService.reverseGeocode(null, -118.2437)).toBeNull();
      expect(await geocodingService.reverseGeocode(34.0522, null)).toBeNull();
    });

    it('should cache reverse geocoding results', async () => {
      axios.get.mockResolvedValue(mockResponse);

      // First call
      const result1 = await geocodingService.reverseGeocode(34.0522, -118.2437);
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await geocodingService.reverseGeocode(34.0522, -118.2437);
      expect(result2).toEqual(result1);
      expect(axios.get).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe('inferTimezone', () => {
    it('should infer timezone from coordinates', async () => {
      axios.get.mockResolvedValue({
        data: {
          address: {
            country_code: 'us',
          },
        },
      });

      const timezone = await geocodingService.inferTimezone(40.7128, -74.006);

      expect(timezone).toBe('America/New_York');
    });

    it('should return null for invalid input', async () => {
      expect(await geocodingService.inferTimezone(null, -74.006)).toBeNull();
      expect(await geocodingService.inferTimezone(40.7128, null)).toBeNull();
    });
  });

  describe('getTimezoneForCountry', () => {
    it('should return correct timezone for known countries', () => {
      expect(geocodingService.getTimezoneForCountry('US', 40, -75)).toBe(
        'America/New_York'
      );
      expect(geocodingService.getTimezoneForCountry('GB', 51.5, -0.1)).toBe(
        'Europe/London'
      );
      expect(geocodingService.getTimezoneForCountry('JP', 35.67, 139.65)).toBe(
        'Asia/Tokyo'
      );
    });

    it('should handle US timezone variations by longitude', () => {
      const eastern = geocodingService.getTimezoneForCountry('US', 40, -75);
      const central = geocodingService.getTimezoneForCountry('US', 40, -95);
      const mountain = geocodingService.getTimezoneForCountry('US', 40, -105);
      const pacific = geocodingService.getTimezoneForCountry('US', 40, -120);

      expect(eastern).toBe('America/New_York');
      expect(central).toBe('America/Chicago');
      expect(mountain).toBe('America/Denver');
      expect(pacific).toBe('America/Los_Angeles');
    });

    it('should return UTC for unknown country codes', () => {
      const result = geocodingService.getTimezoneForCountry('XX', 0, 0);
      expect(result).toBe('UTC');
    });
  });

  describe('clearCache', () => {
    it('should clear the geocoding cache', async () => {
      axios.get.mockResolvedValue({
        data: [{ lat: '34.0522', lon: '-118.2437' }],
      });

      // Geocode to populate cache
      await geocodingService.geocodeLocation('Los Angeles');
      expect(geocodingService.getCacheSize()).toBeGreaterThan(0);

      // Clear cache
      geocodingService.clearCache();
      expect(geocodingService.getCacheSize()).toBe(0);
    });
  });

  describe('getDiagnostics', () => {
    it('should return service diagnostics', () => {
      const diagnostics = geocodingService.getDiagnostics();

      expect(diagnostics).toHaveProperty('circuitState');
      expect(diagnostics).toHaveProperty('failureCount');
      expect(diagnostics).toHaveProperty('concurrentRequests');
      expect(diagnostics).toHaveProperty('cacheSize');
      expect(diagnostics).toHaveProperty('timeout');
      expect(diagnostics).toHaveProperty('maxRetries');

      expect(diagnostics.circuitState).toBe('closed');
      expect(diagnostics.failureCount).toBe(0);
      expect(diagnostics.concurrentRequests).toBe(0);
    });
  });
});
