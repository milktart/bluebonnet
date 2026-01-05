/**
 * Airport Service
 * Handles airport data lookups and airline information
 */

import { Op } from 'sequelize';
import { Airport } from '../models';
import logger from '../utils/logger';

// Load airlines data
const airlines = require('../data/airlines.json') as any;

interface AirportData {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  airport_name: string;
  city_name: string;
  country_name: string;
  timezone: string;
}

interface Airline {
  iata: string;
  name: string;
}

interface ParsedFlightNumber {
  airlineCode: string | null;
  flightNum: string | null;
}

export class AirportService {
  /**
   * Find airport by IATA code
   */
  async getAirportByCode(iataCode: string): Promise<AirportData | null> {
    try {
      if (!iataCode || typeof iataCode !== 'string') return null;

      const code = iataCode.toUpperCase().trim();

      // Fetch from database
      const airport = await Airport.findOne({ where: { iata: code } });

      if (!airport) return null;

      // Return normalized format for backward compatibility
      const result: AirportData = {
        iata: (airport as any).iata,
        name: (airport as any).name,
        city: (airport as any).city,
        country: (airport as any).country,
        lat: (airport as any).latitude,
        lng: (airport as any).longitude,
        latitude: (airport as any).latitude,
        longitude: (airport as any).longitude,
        airport_name: (airport as any).name,
        city_name: (airport as any).city,
        country_name: (airport as any).country,
        timezone: (airport as any).timezone,
      };

      return result;
    } catch (error) {
      logger.error('Error fetching airport by code:', error);
      return null;
    }
  }

  /**
   * Search airports by name or city
   */
  async searchAirports(query: string, limit: number = 10): Promise<AirportData[]> {
    try {
      if (!query || typeof query !== 'string') return [];

      const searchTerm = query.toLowerCase().trim();

      // Fetch from database
      const airports = await Airport.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchTerm}%` } },
            { city: { [Op.iLike]: `%${searchTerm}%` } },
            { iata: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        limit,
        order: [
          // Prioritize exact IATA matches
          [(Airport as any).sequelize.literal(`CASE WHEN LOWER(iata) = '${searchTerm}' THEN 0 ELSE 1 END`)],
          // Then exact city matches
          [(Airport as any).sequelize.literal(`CASE WHEN LOWER(city) = '${searchTerm}' THEN 0 ELSE 1 END`)],
          ['name', 'ASC'],
        ],
      });

      // Return normalized format for backward compatibility
      const results: AirportData[] = airports.map((airport: any) => ({
        iata: airport.iata,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        lat: airport.latitude,
        lng: airport.longitude,
        latitude: airport.latitude,
        longitude: airport.longitude,
        airport_name: airport.name,
        city_name: airport.city,
        country_name: airport.country,
        timezone: airport.timezone,
      }));

      return results;
    } catch (error) {
      logger.error('Error searching airports:', error);
      return [];
    }
  }

  /**
   * Get airline by IATA code
   */
  getAirlineByCode(iataCode: string): Airline | null {
    if (!iataCode || typeof iataCode !== 'string') return null;

    const code = iataCode.toUpperCase().trim();
    return airlines.find((airline: Airline) => airline.iata === code) || null;
  }

  /**
   * Extract airline code from flight number
   */
  getAirlineCodeFromFlightNumber(flightNumber: string): string | null {
    if (!flightNumber || typeof flightNumber !== 'string') return null;

    const cleaned = flightNumber.trim().toUpperCase();

    // Try to match 2-letter airline code at the beginning
    let match = cleaned.match(/^([A-Z]{2})/);
    if (match) {
      const code = match[1];
      // Verify it's a valid airline code
      const airline = this.getAirlineByCode(code);
      return airline ? code : null;
    }

    // Try to match 1-letter and 1-digit pattern (like B6, F9)
    const singleMatch = cleaned.match(/^([A-Z]\d)/);
    if (singleMatch) {
      const code = singleMatch[1];
      const airline = this.getAirlineByCode(code);
      return airline ? code : null;
    }

    // Try to match digit-letter pattern (like 5J, 6E, 7C, 9C, 9W, 3U)
    const digitMatch = cleaned.match(/^(\d[A-Z])/);
    if (digitMatch) {
      const code = digitMatch[1];
      const airline = this.getAirlineByCode(code);
      return airline ? code : null;
    }

    return null;
  }

  /**
   * Get airline name from flight number
   */
  getAirlineNameFromFlightNumber(flightNumber: string): string | null {
    const code = this.getAirlineCodeFromFlightNumber(flightNumber);
    if (!code) return null;

    const airline = this.getAirlineByCode(code);
    return airline ? airline.name : null;
  }

  /**
   * Parse flight number to get airline code and number
   */
  parseFlightNumber(flightNumber: string): ParsedFlightNumber {
    if (!flightNumber || typeof flightNumber !== 'string') {
      return { airlineCode: null, flightNum: null };
    }

    const cleaned = flightNumber.trim().toUpperCase();

    // Try 2-letter code
    let match = cleaned.match(/^([A-Z]{2})(\d+)$/);
    if (match && this.getAirlineByCode(match[1])) {
      return { airlineCode: match[1], flightNum: match[2] };
    }

    // Try letter-digit code (B6, F9)
    match = cleaned.match(/^([A-Z]\d)(\d+)$/);
    if (match && this.getAirlineByCode(match[1])) {
      return { airlineCode: match[1], flightNum: match[2] };
    }

    // Try digit-letter code (5J, 6E)
    match = cleaned.match(/^(\d[A-Z])(\d+)$/);
    if (match && this.getAirlineByCode(match[1])) {
      return { airlineCode: match[1], flightNum: match[2] };
    }

    return { airlineCode: null, flightNum: null };
  }

  /**
   * Get all airports (for autocomplete, etc.)
   */
  async getAllAirports(limit: number | null = null): Promise<AirportData[]> {
    try {
      const query: any = {
        order: [['name', 'ASC']],
      };

      if (limit) {
        query.limit = limit;
      }

      const airports = await Airport.findAll(query);

      // Return normalized format for backward compatibility
      return airports.map((airport: any) => ({
        iata: airport.iata,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        lat: airport.latitude,
        lng: airport.longitude,
        latitude: airport.latitude,
        longitude: airport.longitude,
        airport_name: airport.name,
        city_name: airport.city,
        country_name: airport.country,
        timezone: airport.timezone,
      }));
    } catch (error) {
      logger.error('Error fetching all airports:', error);
      return [];
    }
  }

  /**
   * Get all airlines
   */
  getAllAirlines(): Airline[] {
    return airlines;
  }
}

export const airportService = new AirportService();
export default airportService;
