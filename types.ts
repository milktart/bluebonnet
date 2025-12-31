/**
 * Bluebonnet API Type Definitions
 *
 * Defines all core API response and data types for the travel planner application.
 * These types serve as the source of truth for frontend and backend communication.
 *
 * Usage in backend:
 *   - Use in JSDoc comments: @returns {Trip} A trip object
 *   - Helps with IDE autocompletion and documentation
 *
 * Usage in frontend:
 *   - Import and use in TypeScript: const trip: Trip = data
 *   - Ensures type safety across API boundaries
 */

// ============================================================================
// Authentication & User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message: string;
}

// ============================================================================
// Trip Types
// ============================================================================

export type TripPurpose = 'business' | 'leisure' | 'family' | 'romantic' | 'adventure' | 'pleasure' | 'other';

export interface Trip {
  id: string;
  userId: string;
  name: string;
  departureDate: string; // ISO date: YYYY-MM-DD
  returnDate: string | null; // ISO date: YYYY-MM-DD
  purpose: TripPurpose;
  defaultCompanionEditPermission: boolean;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;

  // Populated associations
  flights?: Flight[];
  hotels?: Hotel[];
  events?: Event[];
  transportation?: Transportation[];
  carRentals?: CarRental[];
  companions?: TravelCompanion[];
  vouchers?: Voucher[];
}

export interface TripListResponse {
  success: boolean;
  data: {
    trips: Trip[];
    standalone?: any[];
  };
  message: string;
}

export interface TripStatsResponse {
  success: boolean;
  data: {
    totalTrips: number;
    upcomingTrips: number;
    pastTrips: number;
    totalFlights: number;
    totalHotels: number;
    companionsCount: number;
  };
  message: string;
}

// ============================================================================
// Travel Item Types
// ============================================================================

export interface Flight {
  id: string;
  tripId: string | null;
  userId: string | null;
  flightNumber: string;
  origin: string;
  destination: string;
  originTimezone: string;
  destinationTimezone: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  departureDateTime: string; // ISO datetime
  arrivalDateTime: string; // ISO datetime
  pnr?: string;
  seat?: string;
  createdAt: string;
  updatedAt: string;
  companions?: ItemCompanion[];
}

export interface Hotel {
  id: string;
  tripId: string | null;
  userId: string | null;
  hotelName: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  checkInDateTime: string; // ISO datetime
  checkOutDateTime: string; // ISO datetime
  confirmationNumber?: string;
  roomNumber?: string;
  createdAt: string;
  updatedAt: string;
  companions?: ItemCompanion[];
}

export interface Event {
  id: string;
  tripId: string | null;
  userId: string | null;
  name: string;
  startDateTime: string; // ISO datetime
  endDateTime: string; // ISO datetime
  location: string;
  lat?: number;
  lng?: number;
  isConfirmed: boolean;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  eventUrl?: string;
  createdAt: string;
  updatedAt: string;
  companions?: ItemCompanion[];
}

export interface Transportation {
  id: string;
  tripId: string | null;
  userId: string | null;
  method: string; // 'taxi', 'train', 'bus', etc.
  journeyNumber?: string;
  origin: string;
  destination: string;
  originTimezone: string;
  destinationTimezone: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  departureDateTime: string; // ISO datetime
  arrivalDateTime: string; // ISO datetime
  confirmationNumber?: string;
  seat?: string;
  createdAt: string;
  updatedAt: string;
  companions?: ItemCompanion[];
}

export interface CarRental {
  id: string;
  tripId: string | null;
  userId: string | null;
  company: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTimezone: string;
  dropoffTimezone: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupDateTime: string; // ISO datetime
  dropoffDateTime: string; // ISO datetime
  confirmationNumber?: string;
  createdAt: string;
  updatedAt: string;
  companions?: ItemCompanion[];
}

export type TravelItem = Flight | Hotel | Event | Transportation | CarRental;

// ============================================================================
// Companion Types
// ============================================================================

export interface TravelCompanion {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  userId?: string | null; // For linked user accounts
  createdBy: string; // User ID who created this companion
  canBeAddedByOthers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripCompanion {
  id: string;
  tripId: string;
  companionId: string;
  canEdit: boolean;
  canAddItems: boolean;
  permissionSource: 'owner' | 'manage_travel' | 'explicit';
  addedBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  companion?: TravelCompanion;
}

export type ItemCompanionStatus = 'attending' | 'not_attending';

export interface ItemCompanion {
  id: string;
  itemType: 'flight' | 'hotel' | 'event' | 'transportation' | 'car_rental';
  itemId: string;
  companionId: string;
  status: ItemCompanionStatus;
  inheritedFromTrip: boolean;
  addedBy: string; // User ID
  createdAt: string;
  updatedAt: string;
  companion?: TravelCompanion;
}

// ============================================================================
// Voucher Types
// ============================================================================

export type VoucherType =
  | 'TRAVEL_CREDIT'
  | 'UPGRADE_CERT'
  | 'REGIONAL_UPGRADE_CERT'
  | 'GLOBAL_UPGRADE_CERT'
  | 'COMPANION_CERT'
  | 'GIFT_CARD'
  | 'MISC';

export type VoucherStatus = 'OPEN' | 'PARTIALLY_USED' | 'USED' | 'EXPIRED' | 'TRANSFERRED' | 'CANCELLED';

export interface Voucher {
  id: string;
  userId?: string | null;
  type: VoucherType;
  issuer: string;
  voucherNumber: string;
  status: VoucherStatus;
  totalValue: number;
  usedAmount: number;
  expirationDate?: string | null; // ISO date
  parentVoucherId?: string | null; // For reissuances
  createdAt: string;
  updatedAt: string;
  attachments?: VoucherAttachment[];
}

export type TravelerType = 'USER' | 'COMPANION';

export interface VoucherAttachment {
  id: string;
  voucherId: string;
  flightId?: string | null;
  travelerId: string; // UUID of User or TravelCompanion
  travelerType: TravelerType;
  attachmentValue: number;
  attachmentDate: string; // ISO date
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: ApiErrorDetail[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationInfo;
}

// ============================================================================
// Request Query Parameters
// ============================================================================

export interface TripsQueryParams {
  filter?: 'upcoming' | 'past' | 'all';
  page?: number;
  limit?: number;
  search?: string;
}

export interface CompanionsQueryParams {
  tripId?: string;
  search?: string;
  limit?: number;
}

// ============================================================================
// Common Enums (for easier type checking)
// ============================================================================

export enum ItemType {
  Flight = 'flight',
  Hotel = 'hotel',
  Event = 'event',
  Transportation = 'transportation',
  CarRental = 'car_rental',
}

export enum PermissionSource {
  Owner = 'owner',
  ManageTravel = 'manage_travel',
  Explicit = 'explicit',
}
