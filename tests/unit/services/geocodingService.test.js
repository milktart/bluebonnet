const geocodingService = require('../../../services/geocodingService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('GeocodingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the cache between tests
    geocodingService.clearCache();
  });

  describe('geocode', () => {
    const mockResponse = {
      data: [
        {
          lat: '34.0522',
          lon: '-118.2437',
          display_name: 'Los Angeles, California, United States',
        },
      ],
    };

    it('should geocode a location successfully', async () => {
      axios.get.mockResolvedValue(mockResponse);

      const result = await geocodingService.geocode('Los Angeles, CA');

      expect(result).toEqual({
        lat: 34.0522,
        lng: -118.2437,
        displayName: 'Los Angeles, California, United States',
      });
      expect(axios.get).toHaveBeenCalled();
    });

    it('should return cached result on second request', async () => {
      axios.get.mockResolvedValue(mockResponse);

      // First request
      await geocodingService.geocode('Los Angeles, CA');

      // Second request should use cache
      const result = await geocodingService.geocode('Los Angeles, CA');

      expect(result).toBeDefined();
      expect(axios.get).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should return null for invalid location', async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await geocodingService.geocode('Invalid Location XYZ123');

      expect(result).toBeNull();
    });

    it('should return null for empty input', async () => {
      const result = await geocodingService.geocode('');

      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await geocodingService.geocode('Los Angeles');

      expect(result).toBeNull();
    });

    it('should respect rate limiting', async () => {
      axios.get.mockResolvedValue(mockResponse);

      const start = Date.now();

      // Make two requests
      await geocodingService.geocode('Location 1');
      await geocodingService.geocode('Location 2');

      const elapsed = Date.now() - start;

      // Should have waited at least the rate limit duration between requests
      expect(elapsed).toBeGreaterThanOrEqual(1000); // Default GEOCODING_RATE_LIMIT is 1000ms
    });
  });

  describe('clearCache', () => {
    it('should clear the geocoding cache', async () => {
      const mockResponse = {
        data: [{ lat: '34.0522', lon: '-118.2437', display_name: 'LA' }],
      };
      axios.get.mockResolvedValue(mockResponse);

      // Geocode to populate cache
      await geocodingService.geocode('Los Angeles');
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Clear cache
      geocodingService.clearCache();

      // Geocode again - should call API again (not use cache)
      await geocodingService.geocode('Los Angeles');
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
