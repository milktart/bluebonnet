/**
 * API Client Service
 * Wrapper for Express backend API calls
 * Dynamically determines the API base URL based on the current host
 */

function getApiBase(): string {
  // If we're in development mode with localhost, use port 3501 (Docker) or 3000 (local)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    console.log('[API DEBUG] getApiBase called:', { hostname, protocol, port });

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development - use localhost:3000 (local node server)
      const url = `${protocol}//localhost:3000/api`;
      console.log('[API DEBUG] Using localhost, URL:', url);
      return url;
    } else {
      // Remote access or Docker (proxied domain, etc.) - use relative URL
      // The proxy/nginx handles port mapping, so don't include port in URL
      console.log('[API DEBUG] Using relative URL for remote access');
      return '/api';
    }
  }
  console.log('[API DEBUG] SSR fallback URL');
  return 'http://localhost:3000/api'; // Fallback for SSR
}

const API_BASE = getApiBase();

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Normalize API response to extract data
 * Handles both direct data responses and wrapped {success, data, message} format
 */
function normalizeResponse(response: any): any {
  if (response && typeof response === 'object' && 'data' in response) {
    // Response is wrapped in {success, data, message} format
    return response.data;
  }
  return response;
}

export async function apiCall(
  endpoint: string,
  options?: ApiOptions
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `API error (${response.status})`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {
          // Use default message
        }
      }

      // Map common HTTP errors to user-friendly messages
      if (response.status === 401) {
        // Handle authentication errors on the client side
        if (typeof window !== 'undefined') {
          // Redirect to login page immediately
          window.location.href = '/login';
        }
        throw new Error('Your session has expired. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to access this resource.');
      } else if (response.status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (response.status === 409) {
        // Use the API message if available, otherwise use generic message
        throw new Error(errorMessage !== `API error (409)` ? errorMessage : 'This item already exists or there was a conflict.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(errorMessage);
    }

    // Handle 204 No Content response
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    const normalized = normalizeResponse(data);
    return normalized;
  } catch (error) {
    // Transform network errors to user-friendly messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    // Re-throw API errors as-is
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unknown errors
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Trips API
 */
export const tripsApi = {
  getAll: (filter: string = 'upcoming') => apiCall(`/v1/trips?filter=${filter}`),

  getOne: (id: string) => apiCall(`/v1/trips/${id}`),

  create: (data: any) =>
    apiCall('/v1/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/v1/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/trips/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Flights API
 */
export const flightsApi = {
  getById: (id: string) =>
    apiCall(`/v1/flights/${id}`),

  getByTrip: (tripId: string) =>
    apiCall(`/v1/flights/trips/${tripId}`),

  // Create standalone flight (not associated with a trip)
  createStandalone: (data: any) =>
    apiCall(`/v1/flights`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create flight within a trip
  create: (tripId: string, data: any) => {
    // If tripId is empty, create standalone
    if (!tripId) {
      return flightsApi.createStandalone(data);
    }
    return apiCall(`/v1/flights/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: any) =>
    apiCall(`/v1/flights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/flights/${id}`, {
      method: 'DELETE',
    }),

  // Look up airline by flight number
  lookupAirline: (flightNumber: string) =>
    apiCall(`/v1/flights/lookup/airline/${encodeURIComponent(flightNumber.toUpperCase())}`),
};

/**
 * Hotels API
 */
export const hotelsApi = {
  getById: (id: string) =>
    apiCall(`/v1/hotels/${id}`),

  getByTrip: (tripId: string) =>
    apiCall(`/v1/hotels/trips/${tripId}`),

  // Create standalone hotel
  createStandalone: (data: any) =>
    apiCall(`/v1/hotels`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create hotel within a trip
  create: (tripId: string, data: any) => {
    if (!tripId) {
      return hotelsApi.createStandalone(data);
    }
    return apiCall(`/v1/hotels/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: any) =>
    apiCall(`/v1/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/hotels/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Events API
 */
export const eventsApi = {
  getById: (id: string) =>
    apiCall(`/v1/events/${id}`),

  getByTrip: (tripId: string) =>
    apiCall(`/v1/events/trips/${tripId}`),

  // Create standalone event
  createStandalone: (data: any) =>
    apiCall(`/v1/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create event within a trip
  create: (tripId: string, data: any) => {
    if (!tripId) {
      return eventsApi.createStandalone(data);
    }
    return apiCall(`/v1/events/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: any) =>
    apiCall(`/v1/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/events/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Transportation API
 */
export const transportationApi = {
  getById: (id: string) =>
    apiCall(`/v1/transportation/${id}`),

  getByTrip: (tripId: string) =>
    apiCall(`/v1/transportation/trips/${tripId}`),

  // Create standalone transportation
  createStandalone: (data: any) =>
    apiCall(`/v1/transportation`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create transportation within a trip
  create: (tripId: string, data: any) => {
    if (!tripId) {
      return transportationApi.createStandalone(data);
    }
    return apiCall(`/v1/transportation/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: any) =>
    apiCall(`/v1/transportation/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/transportation/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Car Rentals API
 */
export const carRentalsApi = {
  getById: (id: string) =>
    apiCall(`/v1/car-rentals/${id}`),

  getByTrip: (tripId: string) =>
    apiCall(`/v1/car-rentals/trips/${tripId}`),

  // Create standalone car rental
  createStandalone: (data: any) =>
    apiCall(`/v1/car-rentals`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create car rental within a trip
  create: (tripId: string, data: any) => {
    if (!tripId) {
      return carRentalsApi.createStandalone(data);
    }
    return apiCall(`/v1/car-rentals/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: string, data: any) =>
    apiCall(`/v1/car-rentals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/car-rentals/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Companions API
 */
export const companionsApi = {
  getAll: () =>
    apiCall(`/v1/companions/all`),

  getByTrip: (tripId: string) =>
    apiCall(`/v1/companions/trips/${tripId}`),

  addToTrip: (tripId: string, companionId: string, canEdit: boolean) =>
    apiCall(`/v1/companions/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify({ companionId, canEdit }),
    }),

  removeFromTrip: (tripId: string, companionId: string) =>
    apiCall(`/v1/companions/trips/${tripId}/${companionId}`, {
      method: 'DELETE',
    }),
};

/**
 * Item Companions API
 */
export const itemCompanionsApi = {
  update: (itemType: string, itemId: string, companionIds: string[]) =>
    apiCall(`/v1/item-companions/${itemType}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ companionIds }),
    }),
};

/**
 * Vouchers API
 */
export const vouchersApi = {
  getByTrip: (tripId: string) =>
    apiCall(`/v1/vouchers/trips/${tripId}`),

  create: (tripId: string, data: any) =>
    apiCall(`/v1/vouchers/trips/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/v1/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/v1/vouchers/${id}`, {
      method: 'DELETE',
    }),
};
