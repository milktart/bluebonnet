// Item types
export interface Trip {
  id: string;
  userId: string;
  name: string;
  purpose: string;
  departureDate: string;
  returnDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Flight {
  id: string;
  userId: string;
  tripId?: string;
  flightNumber: string;
  airline: string;
  origin: string;
  originTimezone?: string;
  originLat?: number;
  originLng?: number;
  destination: string;
  destinationTimezone?: string;
  destinationLat?: number;
  destinationLng?: number;
  departureDateTime: string;
  arrivalDateTime: string;
  pnr?: string;
  seat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Hotel {
  id: string;
  userId: string;
  tripId?: string;
  hotelName: string;
  address: string;
  phone?: string;
  checkInDateTime: string;
  checkOutDateTime: string;
  timezone?: string;
  lat?: number;
  lng?: number;
  confirmationNumber?: string;
  roomNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  userId: string;
  tripId?: string;
  name: string;
  location: string;
  startDateTime: string;
  endDateTime?: string;
  timezone?: string;
  lat?: number;
  lng?: number;
  description?: string;
  ticketNumber?: string;
  isConfirmed?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transportation {
  id: string;
  userId: string;
  tripId?: string;
  method: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  arrivalDateTime: string;
  originTimezone?: string;
  destinationTimezone?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  bookingReference?: string;
  seat?: string;
  confirmationNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarRental {
  id: string;
  userId: string;
  tripId?: string;
  company: string;
  pickupLocation: string;
  pickupTimezone?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLocation: string;
  dropoffTimezone?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupDateTime: string;
  dropoffDateTime: string;
  confirmationNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TravelItem = Flight | Hotel | Event | Transportation | CarRental;
export type ItemType = 'flight' | 'hotel' | 'event' | 'transportation' | 'carRental' | 'trip';

// User and Auth
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form related
export interface FormData {
  [key: string]: string | number | boolean | null | undefined;
}

// Companion
export interface TravelCompanion {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemCompanion {
  id: string;
  itemType: string;
  itemId: string;
  companionId: string;
  createdAt?: string;
  updatedAt?: string;
}
