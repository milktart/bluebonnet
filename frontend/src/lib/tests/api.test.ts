import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiCall, tripsApi, flightsApi, hotelsApi, eventsApi, transportationApi, carRentalsApi, companionsApi, vouchersApi } from '$lib/services/api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client - apiCall function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: '1', name: 'Test Trip' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await apiCall('/v1/trips/1');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/trips/1'),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should make a successful POST request', async () => {
      const mockData = { id: '1', name: 'New Trip' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await apiCall('/v1/trips', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Trip' })
      });

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });

    it('should unwrap data from wrapped response format', async () => {
      const wrappedData = { success: true, data: { id: '1', name: 'Trip' }, message: 'OK' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => wrappedData
      });

      const result = await apiCall('/v1/trips/1');
      expect(result).toEqual({ id: '1', name: 'Trip' });
    });
  });

  describe('Error handling', () => {
    it('should throw user-friendly error for 401 (Unauthorized)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(apiCall('/v1/trips')).rejects.toThrow(
        'Your session has expired. Please log in again.'
      );
    });

    it('should throw user-friendly error for 403 (Forbidden)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' })
      });

      await expect(apiCall('/v1/trips')).rejects.toThrow(
        'You do not have permission to access this resource.'
      );
    });

    it('should throw user-friendly error for 404 (Not Found)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' })
      });

      await expect(apiCall('/v1/trips/999')).rejects.toThrow(
        'The requested resource was not found.'
      );
    });

    it('should throw user-friendly error for 409 (Conflict)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Conflict' })
      });

      await expect(apiCall('/v1/trips', { method: 'POST' })).rejects.toThrow(
        'This item already exists or there was a conflict.'
      );
    });

    it('should throw user-friendly error for 5xx (Server Error)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      });

      await expect(apiCall('/v1/trips')).rejects.toThrow(
        'Server error. Please try again later.'
      );
    });

    it('should throw user-friendly error for network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(apiCall('/v1/trips')).rejects.toThrow(
        'Network error. Please check your internet connection and try again.'
      );
    });

    it('should use custom error message when available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid trip name' })
      });

      await expect(apiCall('/v1/trips', { method: 'POST' })).rejects.toThrow(
        'Invalid trip name'
      );
    });

    it('should fallback to text response when JSON parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => 'Server error'
      });

      await expect(apiCall('/v1/trips')).rejects.toThrow('Server error');
    });
  });

  describe('Request options', () => {
    it('should include credentials in all requests', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await apiCall('/v1/trips');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });

    it('should merge custom headers with default headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await apiCall('/v1/trips', {
        headers: { 'X-Custom-Header': 'value' }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'value'
          })
        })
      );
    });
  });
});

describe('Trips API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getAll endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: [] })
    });

    await tripsApi.getAll();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/trips'),
      expect.any(Object)
    );
  });

  it('should call getOne endpoint with trip ID', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Trip' })
    });

    await tripsApi.getOne('1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/trips/1'),
      expect.any(Object)
    );
  });

  it('should create a trip with POST', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'New Trip' })
    });

    await tripsApi.create({ name: 'New Trip' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/trips'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('should update a trip with PUT', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Updated Trip' })
    });

    await tripsApi.update('1', { name: 'Updated Trip' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/trips/1'),
      expect.objectContaining({
        method: 'PUT'
      })
    );
  });

  it('should delete a trip with DELETE', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await tripsApi.delete('1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/trips/1'),
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });
});

describe('Flights API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get flights by trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flights: [] })
    });

    await flightsApi.getByTrip('trip-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/flights/trips/trip-1'),
      expect.any(Object)
    );
  });

  it('should create a flight', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', origin: 'JFK' })
    });

    await flightsApi.create('trip-1', { origin: 'JFK', destination: 'LAX' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/flights/trips/trip-1'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});

describe('Hotels API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get hotels by trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hotels: [] })
    });

    await hotelsApi.getByTrip('trip-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/hotels/trips/trip-1'),
      expect.any(Object)
    );
  });

  it('should create a hotel', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Hotel' })
    });

    await hotelsApi.create('trip-1', { name: 'Hotel' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/hotels/trips/trip-1'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});

describe('Events API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get events by trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [] })
    });

    await eventsApi.getByTrip('trip-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/events/trips/trip-1'),
      expect.any(Object)
    );
  });

  it('should create an event', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Event' })
    });

    await eventsApi.create('trip-1', { name: 'Event' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/events/trips/trip-1'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});

describe('Companions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get companions by trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ companions: [] })
    });

    await companionsApi.getByTrip('trip-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/companions/trips/trip-1'),
      expect.any(Object)
    );
  });

  it('should add companion to trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', email: 'test@example.com' })
    });

    await companionsApi.addToTrip('trip-1', 'test@example.com', true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/companions/trips/trip-1'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('should remove companion from trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await companionsApi.removeFromTrip('trip-1', 'companion-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/companions/trips/trip-1/companion-1'),
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });
});

describe('Vouchers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get vouchers by trip', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ vouchers: [] })
    });

    await vouchersApi.getByTrip('trip-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/vouchers/trips/trip-1'),
      expect.any(Object)
    );
  });

  it('should create a voucher', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', code: 'SAVE20' })
    });

    await vouchersApi.create('trip-1', { code: 'SAVE20' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/vouchers/trips/trip-1'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
