const airportService = require('../../../services/airportService');
const { Airport } = require('../../../models');
const cacheService = require('../../../services/cacheService');

// Mock dependencies
jest.mock('../../../models', () => ({
  Airport: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    sequelize: {
      literal: jest.fn((sql) => sql),
    },
  },
}));

jest.mock('../../../services/cacheService', () => ({
  getCachedAirportByCode: jest.fn(),
  cacheAirportByCode: jest.fn(),
  getCachedAirportSearch: jest.fn(),
  cacheAirportSearch: jest.fn(),
}));

describe('AirportService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAirportByCode', () => {
    const mockAirport = {
      iata: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      latitude: 33.9425,
      longitude: -118.408,
      timezone: 'America/Los_Angeles',
    };

    it('should return cached airport if available', async () => {
      const cachedData = { iata: 'LAX', name: 'Los Angeles International Airport' };
      cacheService.getCachedAirportByCode.mockResolvedValue(cachedData);

      const result = await airportService.getAirportByCode('LAX');

      expect(result).toEqual(cachedData);
      expect(cacheService.getCachedAirportByCode).toHaveBeenCalledWith('LAX');
      expect(Airport.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache on cache miss', async () => {
      cacheService.getCachedAirportByCode.mockResolvedValue(null);
      Airport.findOne.mockResolvedValue(mockAirport);

      const result = await airportService.getAirportByCode('lax');

      expect(Airport.findOne).toHaveBeenCalledWith({ where: { iata: 'LAX' } });
      expect(cacheService.cacheAirportByCode).toHaveBeenCalled();
      expect(result).toMatchObject({
        iata: 'LAX',
        name: 'Los Angeles International Airport',
        city: 'Los Angeles',
        country: 'United States',
      });
    });

    it('should return null for invalid IATA code', async () => {
      cacheService.getCachedAirportByCode.mockResolvedValue(null);
      Airport.findOne.mockResolvedValue(null);

      const result = await airportService.getAirportByCode('XXX');

      expect(result).toBeNull();
    });

    it('should return null for invalid input', async () => {
      expect(await airportService.getAirportByCode(null)).toBeNull();
      expect(await airportService.getAirportByCode('')).toBeNull();
      expect(await airportService.getAirportByCode(123)).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      cacheService.getCachedAirportByCode.mockResolvedValue(null);
      Airport.findOne.mockRejectedValue(new Error('Database error'));

      const result = await airportService.getAirportByCode('LAX');

      expect(result).toBeNull();
    });
  });

  describe('searchAirports', () => {
    const mockAirports = [
      {
        iata: 'LAX',
        name: 'Los Angeles International Airport',
        city: 'Los Angeles',
        country: 'United States',
        latitude: 33.9425,
        longitude: -118.408,
        timezone: 'America/Los_Angeles',
      },
      {
        iata: 'JFK',
        name: 'John F Kennedy International Airport',
        city: 'New York',
        country: 'United States',
        latitude: 40.6398,
        longitude: -73.7789,
        timezone: 'America/New_York',
      },
    ];

    it('should return cached search results if available', async () => {
      cacheService.getCachedAirportSearch.mockResolvedValue(mockAirports);

      const result = await airportService.searchAirports('los angeles', 10);

      expect(result).toEqual(mockAirports);
      expect(cacheService.getCachedAirportSearch).toHaveBeenCalledWith('los angeles', 10);
      expect(Airport.findAll).not.toHaveBeenCalled();
    });

    it('should search database and cache results on cache miss', async () => {
      cacheService.getCachedAirportSearch.mockResolvedValue(null);
      Airport.findAll.mockResolvedValue(mockAirports);

      const result = await airportService.searchAirports('angeles');

      expect(Airport.findAll).toHaveBeenCalled();
      expect(cacheService.cacheAirportSearch).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array for invalid input', async () => {
      expect(await airportService.searchAirports(null)).toEqual([]);
      expect(await airportService.searchAirports('')).toEqual([]);
      expect(await airportService.searchAirports(123)).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      cacheService.getCachedAirportSearch.mockResolvedValue(null);
      Airport.findAll.mockRejectedValue(new Error('Database error'));

      const result = await airportService.searchAirports('test');

      expect(result).toEqual([]);
    });
  });

  describe('getAirlineByCode', () => {
    it('should return airline by IATA code', () => {
      const result = airportService.getAirlineByCode('AA');

      expect(result).toBeTruthy();
      expect(result.iata).toBe('AA');
    });

    it('should return null for invalid airline code', () => {
      const result = airportService.getAirlineByCode('XXX');

      expect(result).toBeNull();
    });

    it('should return null for invalid input', () => {
      expect(airportService.getAirlineByCode(null)).toBeNull();
      expect(airportService.getAirlineByCode('')).toBeNull();
      expect(airportService.getAirlineByCode(123)).toBeNull();
    });

    it('should handle case-insensitive lookup', () => {
      const result = airportService.getAirlineByCode('aa');

      expect(result).toBeTruthy();
      expect(result.iata).toBe('AA');
    });
  });

  describe('getAirlineCodeFromFlightNumber', () => {
    it('should extract 2-letter airline code', () => {
      expect(airportService.getAirlineCodeFromFlightNumber('AA100')).toBe('AA');
      expect(airportService.getAirlineCodeFromFlightNumber('BA456')).toBe('BA');
    });

    it('should return null for invalid flight number', () => {
      expect(airportService.getAirlineCodeFromFlightNumber('100')).toBeNull();
      expect(airportService.getAirlineCodeFromFlightNumber('INVALID')).toBeNull();
      expect(airportService.getAirlineCodeFromFlightNumber(null)).toBeNull();
      expect(airportService.getAirlineCodeFromFlightNumber('')).toBeNull();
    });
  });

  describe('getAllAirports', () => {
    it('should return all airports', async () => {
      const mockAirports = [
        {
          iata: 'LAX',
          name: 'Los Angeles',
          city: 'Los Angeles',
          country: 'US',
          latitude: 33.9425,
          longitude: -118.408,
        },
        {
          iata: 'JFK',
          name: 'JFK',
          city: 'New York',
          country: 'US',
          latitude: 40.6398,
          longitude: -73.7789,
        },
      ];
      Airport.findAll.mockResolvedValue(mockAirports);

      const result = await airportService.getAllAirports();

      expect(Airport.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      Airport.findAll.mockResolvedValue([]);

      await airportService.getAllAirports(50);

      expect(Airport.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
    });

    it('should handle database errors gracefully', async () => {
      Airport.findAll.mockRejectedValue(new Error('Database error'));

      const result = await airportService.getAllAirports();

      expect(result).toEqual([]);
    });
  });

  describe('getAllAirlines', () => {
    it('should return all airlines', () => {
      const result = airportService.getAllAirlines();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
