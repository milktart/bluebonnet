/**
 * Swagger/OpenAPI Configuration
 * Generates API documentation for all /api/v1/* endpoints
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bluebonnet Travel Planner API',
      version: '1.0.0',
      description: 'RESTful JSON API for the Bluebonnet travel planning application',
      contact: {
        name: 'Bluebonnet Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://bluebonnet.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication (Passport.js)',
        },
      },
      schemas: {
        Trip: {
          type: 'object',
          required: ['id', 'userId', 'name', 'departureDate'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Trip unique identifier',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID of trip owner',
            },
            name: {
              type: 'string',
              description: 'Trip name/title',
              example: 'Summer Europe Trip',
            },
            departureDate: {
              type: 'string',
              format: 'date-time',
              description: 'Departure date (ISO 8601)',
              example: '2024-06-01T00:00:00Z',
            },
            returnDate: {
              type: 'string',
              format: 'date-time',
              description: 'Return date (ISO 8601)',
              example: '2024-06-15T00:00:00Z',
            },
            description: {
              type: 'string',
              description: 'Trip description',
            },
            color: {
              type: 'string',
              description: 'Trip color code',
            },
            isPrivate: {
              type: 'boolean',
              default: false,
              description: 'Whether trip is private (invitation only)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Flight: {
          type: 'object',
          required: ['id', 'origin', 'destination', 'departureDateTime'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Flight unique identifier',
            },
            tripId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated trip ID (optional)',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID of item owner',
            },
            airline: {
              type: 'string',
              description: 'Airline name',
              example: 'United Airlines',
            },
            flightNumber: {
              type: 'string',
              description: 'Flight number',
              example: 'UA123',
            },
            origin: {
              type: 'string',
              description: 'Origin airport code',
              example: 'JFK',
            },
            destination: {
              type: 'string',
              description: 'Destination airport code',
              example: 'LHR',
            },
            departureDateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Departure datetime (ISO 8601)',
            },
            arrivalDateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Arrival datetime (ISO 8601)',
            },
            aircraft: {
              type: 'string',
              description: 'Aircraft type',
            },
            seatNumber: {
              type: 'string',
              description: 'Seat number',
            },
            bookingReference: {
              type: 'string',
              description: 'Booking reference/confirmation number',
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Hotel: {
          type: 'object',
          required: ['id', 'name', 'checkInDate', 'checkOutDate'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            tripId: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'Hotel name',
            },
            city: {
              type: 'string',
              description: 'Hotel city',
            },
            address: {
              type: 'string',
              description: 'Full address',
            },
            checkInDate: {
              type: 'string',
              format: 'date-time',
            },
            checkOutDate: {
              type: 'string',
              format: 'date-time',
            },
            roomType: {
              type: 'string',
              description: 'Room type (e.g., deluxe, suite)',
            },
            confirmationNumber: {
              type: 'string',
              description: 'Hotel confirmation number',
            },
            notes: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether operation succeeded',
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)',
            },
            message: {
              type: 'string',
              description: 'Human-readable message',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              description: 'Additional error details',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
  },
  apis: [
    './routes/api/v1/*.js',
    './routes/api/v1/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { specs };
