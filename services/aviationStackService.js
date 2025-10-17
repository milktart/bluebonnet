const axios = require('axios');

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const BASE_URL = 'http://api.aviationstack.com/v1';

class AviationStackService {
  async searchFlight(flightNumber, date = null) {
    try {
      if (!AVIATIONSTACK_API_KEY) {
        throw new Error('AviationStack API key not configured');
      }

      const params = {
        access_key: AVIATIONSTACK_API_KEY,
        flight_iata: flightNumber
      };

      if (date) {
        params.flight_date = date;
      }

      const response = await axios.get(`${BASE_URL}/flights`, { params });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const flight = response.data.data[0];
        
        return {
          success: true,
          data: {
            airline: flight.airline?.name || 'Unknown',
            flightNumber: flight.flight?.iata || flightNumber,
            origin: flight.departure?.airport || flight.departure?.iata || '',
            destination: flight.arrival?.airport || flight.arrival?.iata || '',
            departureDateTime: flight.departure?.scheduled || null,
            arrivalDateTime: flight.arrival?.scheduled || null,
            originTimezone: flight.departure?.timezone || null,
            destinationTimezone: flight.arrival?.timezone || null
          }
        };
      }

      return {
        success: false,
        message: 'Flight not found'
      };

    } catch (error) {
      console.error('AviationStack API Error:', error.message);
      return {
        success: false,
        message: error.response?.data?.error?.message || 'Error fetching flight data',
        error: error.message
      };
    }
  }
}

module.exports = new AviationStackService();