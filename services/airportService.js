const airports = require('../data/airports.json');
const airlines = require('../data/airlines.json');

class AirportService {
  /**
   * Find airport by IATA code
   * @param {string} iataCode - 3-letter IATA airport code (e.g., "JFK")
   * @returns {object|null} Airport object or null if not found
   */
  getAirportByCode(iataCode) {
    if (!iataCode || typeof iataCode !== 'string') return null;

    const code = iataCode.toUpperCase().trim();
    const airport = airports[code];

    if (!airport) return null;

    // Return normalized format for backward compatibility
    return {
      iata: code,
      name: airport.airport_name,
      city: airport.city_name,
      country: airport.country_name,
      lat: airport.latitude,
      lng: airport.longitude,
      ...airport // Include all additional properties
    };
  }

  /**
   * Search airports by name or city
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {array} Array of matching airports
   */
  searchAirports(query, limit = 10) {
    if (!query || typeof query !== 'string') return [];

    const searchTerm = query.toLowerCase().trim();

    const results = [];

    for (const [iataCode, airport] of Object.entries(airports)) {
      if (
        airport.airport_name.toLowerCase().includes(searchTerm) ||
        airport.city_name.toLowerCase().includes(searchTerm) ||
        iataCode.toLowerCase().includes(searchTerm)
      ) {
        // Return normalized format for backward compatibility
        results.push({
          iata: iataCode,
          name: airport.airport_name,
          city: airport.city_name,
          country: airport.country_name,
          lat: airport.latitude,
          lng: airport.longitude,
          ...airport // Include all additional properties
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get airline by IATA code
   * @param {string} iataCode - 2-letter IATA airline code (e.g., "AA")
   * @returns {object|null} Airline object or null if not found
   */
  getAirlineByCode(iataCode) {
    if (!iataCode || typeof iataCode !== 'string') return null;

    const code = iataCode.toUpperCase().trim();
    return airlines.find(airline => airline.iata === code) || null;
  }

  /**
   * Extract airline code from flight number
   * @param {string} flightNumber - Flight number (e.g., "AA100", "BA456")
   * @returns {string|null} Airline IATA code or null
   */
  getAirlineCodeFromFlightNumber(flightNumber) {
    if (!flightNumber || typeof flightNumber !== 'string') return null;

    const cleaned = flightNumber.trim().toUpperCase();

    // Try to match 2-letter airline code at the beginning
    const match = cleaned.match(/^([A-Z]{2})/);
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
   * @param {string} flightNumber - Flight number (e.g., "AA100")
   * @returns {string|null} Airline name or null
   */
  getAirlineNameFromFlightNumber(flightNumber) {
    const code = this.getAirlineCodeFromFlightNumber(flightNumber);
    if (!code) return null;

    const airline = this.getAirlineByCode(code);
    return airline ? airline.name : null;
  }

  /**
   * Parse flight number to get airline code and number
   * @param {string} flightNumber - Flight number (e.g., "AA100")
   * @returns {object} Object with airlineCode and flightNum
   */
  parseFlightNumber(flightNumber) {
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
   * @returns {array} All airports
   */
  getAllAirports() {
    return Object.entries(airports).map(([iataCode, airport]) => ({
      iata: iataCode,
      name: airport.airport_name,
      city: airport.city_name,
      country: airport.country_name,
      lat: airport.latitude,
      lng: airport.longitude,
      ...airport // Include all additional properties
    }));
  }

  /**
   * Get all airlines
   * @returns {array} All airlines
   */
  getAllAirlines() {
    return airlines;
  }
}

module.exports = new AirportService();
