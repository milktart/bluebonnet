/**
 * Bluebonnet Shared Type Definitions
 *
 * Single source of truth for all entity types used by:
 * - Frontend: TypeScript interfaces, API response typing
 * - Backend: JSDoc annotations, validation schemas
 * - Documentation: OpenAPI/Swagger generation
 *
 * Last Updated: December 30, 2025
 * Version: 1.0.0
 */

/**
 * USER TYPES
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  totalTrips: number;
  totalCompanions: number;
  totalVouchers: number;
  lastLogin?: string;
}

/**
 * TRIP TYPES
 */

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  departureDate: string; // ISO date format: YYYY-MM-DD
  returnDate?: string; // ISO date format: YYYY-MM-DD
  purpose?: 'leisure' | 'business' | 'adventure' | 'family' | 'romantic' | 'other';
  defaultCompanionEditPermission?: boolean;

  // Relationships (optional, included in detailed responses)
  flights?: Flight[];
  hotels?: Hotel[];
  events?: Event[];
  carRentals?: CarRental[];
  transportation?: Transportation[];
  tripCompanions?: TripCompanion[];
  vouchers?: Voucher[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface TripWithDetails extends Trip {
  flights: Flight[];
  hotels: Hotel[];
  events: Event[];
  carRentals: CarRental[];
  transportation: Transportation[];
  tripCompanions: TripCompanion[];
  vouchers: Voucher[];
}

export interface TripCreateRequest {
  name: string;
  description?: string;
  departureDate: string;
  returnDate?: string;
  purpose?: string;
  defaultCompanionEditPermission?: boolean;
}

export interface TripUpdateRequest {
  name?: string;
  description?: string;
  departureDate?: string;
  returnDate?: string;
  purpose?: string;
  defaultCompanionEditPermission?: boolean;
}

/**
 * TRAVEL ITEM TYPES
 */

export interface Flight {
  id: string;
  tripId?: string | null;
  userId: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDateTime: string; // ISO datetime in UTC
  arrivalDateTime: string; // ISO datetime in UTC
  originTimezone: string; // IANA timezone string (e.g., America/New_York)
  destinationTimezone: string; // IANA timezone string
  originLat?: number; // Latitude from geocoding
  originLng?: number; // Longitude from geocoding
  destinationLat?: number;
  destinationLng?: number;
  pnr?: string; // Passenger Name Record / confirmation number
  seat?: string;
  notes?: string;
  isAllDay?: boolean; // True if all-day event (00:00 to 23:59)

  // Relationships
  itemCompanions?: ItemCompanion[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface Hotel {
  id: string;
  tripId?: string | null;
  userId: string;
  name: string; // Hotel name
  address: string;
  city: string;
  checkInDateTime: string; // ISO datetime in UTC
  checkOutDateTime: string; // ISO datetime in UTC
  timezone: string; // IANA timezone string
  rate?: number; // Cost per night
  currency?: string; // ISO 4217 currency code
  roomType?: string; // e.g., "Standard", "Deluxe", "Suite"
  numberOfRooms?: number;
  numberOfGuests?: number;
  confirmationNumber?: string;
  notes?: string;
  isAllDay?: boolean; // True if all-day event

  // Relationships
  itemCompanions?: ItemCompanion[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  tripId?: string | null;
  userId: string;
  name: string;
  description?: string;
  startDateTime: string; // ISO datetime in UTC
  endDateTime?: string; // ISO datetime in UTC
  location: string;
  city?: string;
  timezone: string; // IANA timezone string
  lat?: number; // Latitude from geocoding
  lng?: number; // Longitude from geocoding
  ticketNumber?: string;
  cost?: number;
  currency?: string; // ISO 4217 currency code
  notes?: string;
  isAllDay?: boolean; // True if event spans entire day(s)

  // Relationships
  itemCompanions?: ItemCompanion[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface CarRental {
  id: string;
  tripId?: string | null;
  userId: string;
  vendor: string; // e.g., "Hertz", "Avis", "Budget"
  vehicleType: string; // e.g., "Economy", "SUV", "Luxury"
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string; // ISO datetime in UTC
  dropoffDateTime: string; // ISO datetime in UTC
  pickupTimezone: string; // IANA timezone string
  dropoffTimezone?: string; // IANA timezone string
  confirmationNumber?: string;
  cost?: number;
  currency?: string; // ISO 4217 currency code
  notes?: string;

  // Relationships
  itemCompanions?: ItemCompanion[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface Transportation {
  id: string;
  tripId?: string | null;
  userId: string;
  method: 'taxi' | 'shuttle' | 'train' | 'bus' | 'car' | 'bike' | 'walk' | 'other';
  origin: string; // Departure location
  destination: string; // Arrival location
  departureDateTime: string; // ISO datetime in UTC
  arrivalDateTime: string; // ISO datetime in UTC
  originTimezone: string; // IANA timezone string
  destinationTimezone: string; // IANA timezone string
  confirmationNumber?: string;
  cost?: number;
  currency?: string; // ISO 4217 currency code
  notes?: string;

  // Relationships
  itemCompanions?: ItemCompanion[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export type TravelItem = Flight | Hotel | Event | CarRental | Transportation;
export type TravelItemType = 'flight' | 'hotel' | 'event' | 'carRental' | 'transportation';

export interface TravelItemCreateRequest {
  itemType: TravelItemType;
  tripId?: string | null;
  data: Partial<Flight | Hotel | Event | CarRental | Transportation>;
}

/**
 * COMPANION TYPES
 */

export interface TravelCompanion {
  id: string;
  companionId?: string; // For backwards compatibility
  createdById: string; // User who created this companion entry
  firstName?: string;
  lastName?: string;
  displayName: string; // Display name (computed or custom)
  email?: string;
  linkedAccountId?: string; // ID of linked user account (if they joined)
  linkedAccount?: User; // Populated when including linked user

  // Relationships
  trips?: Trip[];
  createdItems?: TravelItem[];

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface TripCompanion {
  id: string;
  tripId: string;
  companionId: string;
  canEdit: boolean; // Permission to edit trip items
  addedById: string; // User who added this companion to trip
  youInvited?: boolean; // This user invited the companion
  theyInvited?: boolean; // Companion invited this user

  // Relationships
  companion?: TravelCompanion;
  trip?: Trip;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemCompanion {
  id: string;
  itemId: string;
  itemType: TravelItemType;
  companionId: string;
  inheritedFromTrip?: boolean; // True if inherited from trip-level companions

  // Relationships
  companion?: TravelCompanion;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanionIndicator {
  id: string;
  displayName: string;
  email?: string;
  avatar?: string; // URL to avatar image
  initials?: string; // First letters of name
}

/**
 * VOUCHER TYPES
 */

export interface Voucher {
  id: string;
  tripId: string;
  type: 'upgrade' | 'voucher' | 'credit' | 'discount' | 'other';
  value: number; // Numeric value
  currency: string; // ISO 4217 currency code
  expiryDate?: string; // ISO date format: YYYY-MM-DD
  code?: string; // Voucher code or reference
  notes?: string;

  // Relationships
  attachments?: VoucherAttachment[];
  trip?: Trip;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherAttachment {
  id: string;
  voucherId: string;
  itemId: string;
  itemType: TravelItemType;
  assignedToCompanionId?: string; // Which companion uses this voucher

  // Relationships
  voucher?: Voucher;
  companion?: TravelCompanion;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API RESPONSE TYPES
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  statusCode: number;
}

/**
 * DASHBOARD VIEW MODELS
 */

export interface DashboardItem {
  type: 'trip' | 'standalone';
  itemType?: TravelItemType;
  data: Trip | TravelItem;
  sortDate: Date;
}

export interface GroupedDashboardItems {
  [dateKey: string]: DashboardItem[];
}

export interface SidebarContent {
  type: 'add-trip' | 'edit-trip' | 'add-item' | 'edit-item' |
        'add-companion' | 'edit-companion' |
        'settings-profile' | 'settings-security' | 'settings-companions' |
        'settings-vouchers' | 'settings-backup' |
        'calendar' | 'item-details';
  itemType?: TravelItemType;
  data: Record<string, any>;
}

export interface DashboardState {
  trips: Trip[];
  standaloneItems: {
    flights: Flight[];
    hotels: Hotel[];
    transportation: Transportation[];
    carRentals: CarRental[];
    events: Event[];
  };
  activeTab: 'upcoming' | 'past';
  filteredItems: DashboardItem[];
  activeView: 'trips' | 'settings';
  expandedTrips: Set<string>;
  selectedItemId: string | null;
  selectedItemType: TravelItemType | null;
  showNewItemMenu: boolean;
  secondarySidebarContent: SidebarContent | null;
  tertiarySidebarContent: SidebarContent | null;
  mapData: {
    flights: Flight[];
    hotels: Hotel[];
    events: Event[];
    transportation: Transportation[];
    carRentals: CarRental[];
  };
  highlightedTripId: string | null;
  highlightedItemId: string | null;
  highlightedItemType: TravelItemType | null;
  groupedItems: GroupedDashboardItems;
  dateKeysInOrder: string[];
  loading: boolean;
  error: string | null;
}

/**
 * REQUEST/RESPONSE HELPERS
 */

export interface GetAllTripsResponse {
  trips: Trip[];
  standalone: {
    flights: Flight[];
    hotels: Hotel[];
    transportation: Transportation[];
    carRentals: CarRental[];
    events: Event[];
  };
  stats?: {
    upcomingCount: number;
    pastCount: number;
  };
}

export interface CreateItemResponse {
  success: boolean;
  item: TravelItem;
  message: string;
}

/**
 * FORM STATE TYPES (for form handling)
 */

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * CONSTANTS AND ENUMS
 */

export const ITEM_TYPES = ['flight', 'hotel', 'event', 'carRental', 'transportation'] as const;

export const TRANSPORT_METHODS = [
  'taxi',
  'shuttle',
  'train',
  'bus',
  'car',
  'bike',
  'walk',
  'other',
] as const;

export const TRIP_PURPOSES = [
  'leisure',
  'business',
  'adventure',
  'family',
  'romantic',
  'other',
] as const;

export const VOUCHER_TYPES = [
  'upgrade',
  'voucher',
  'credit',
  'discount',
  'other',
] as const;

export const TIMEZONE_LIST = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Warsaw',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
] as const;

export const CURRENCY_LIST = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'INR',
  'MXN',
  'BRL',
  'SGD',
  'HKD',
  'NZD',
  'ZAR',
  'MYR',
  'THB',
  'PHP',
  'IDR',
  'VND',
  'KRW',
] as const;

/**
 * TYPE GUARDS AND UTILITIES
 */

export function isFlight(item: TravelItem): item is Flight {
  return 'flightNumber' in item;
}

export function isHotel(item: TravelItem): item is Hotel {
  return 'checkInDateTime' in item && 'checkOutDateTime' in item;
}

export function isEvent(item: TravelItem): item is Event {
  return 'startDateTime' in item && 'location' in item;
}

export function isCarRental(item: TravelItem): item is CarRental {
  return 'pickupDateTime' in item && 'vendor' in item;
}

export function isTransportation(item: TravelItem): item is Transportation {
  return item.constructor.name === 'Transportation' ||
         ('method' in item && 'origin' in item && 'destination' in item);
}

export function getTravelItemType(item: TravelItem): TravelItemType {
  if (isFlight(item)) return 'flight';
  if (isHotel(item)) return 'hotel';
  if (isEvent(item)) return 'event';
  if (isCarRental(item)) return 'carRental';
  if (isTransportation(item)) return 'transportation';
  throw new Error('Unknown travel item type');
}

/**
 * VALIDATION SCHEMAS
 * (Can be used with express-validator or similar validation libraries)
 */

export const ValidationRules = {
  trip: {
    name: { required: true, minLength: 1, maxLength: 255 },
    departureDate: { required: true, format: 'YYYY-MM-DD' },
    returnDate: { required: false, format: 'YYYY-MM-DD' },
    description: { required: false, maxLength: 1000 },
  },
  flight: {
    flightNumber: { required: true, minLength: 1, maxLength: 10 },
    airline: { required: false, maxLength: 100 },
    origin: { required: true, minLength: 1 },
    destination: { required: true, minLength: 1 },
    departureDateTime: { required: true, format: 'ISO8601' },
    arrivalDateTime: { required: true, format: 'ISO8601' },
    originTimezone: { required: false, format: 'IANA' },
    destinationTimezone: { required: false, format: 'IANA' },
  },
  hotel: {
    name: { required: true, minLength: 1, maxLength: 255 },
    address: { required: true, minLength: 1 },
    city: { required: true, minLength: 1 },
    checkInDateTime: { required: true, format: 'ISO8601' },
    checkOutDateTime: { required: true, format: 'ISO8601' },
    timezone: { required: true, format: 'IANA' },
  },
  event: {
    name: { required: true, minLength: 1, maxLength: 255 },
    startDateTime: { required: true, format: 'ISO8601' },
    location: { required: true, minLength: 1 },
    timezone: { required: true, format: 'IANA' },
  },
  carRental: {
    vendor: { required: true, minLength: 1 },
    vehicleType: { required: true, minLength: 1 },
    pickupDateTime: { required: true, format: 'ISO8601' },
    dropoffDateTime: { required: true, format: 'ISO8601' },
    pickupLocation: { required: true, minLength: 1 },
    dropoffLocation: { required: true, minLength: 1 },
  },
  transportation: {
    method: { required: true, enum: TRANSPORT_METHODS },
    origin: { required: true, minLength: 1 },
    destination: { required: true, minLength: 1 },
    departureDateTime: { required: true, format: 'ISO8601' },
    arrivalDateTime: { required: true, format: 'ISO8601' },
  },
} as const;

/**
 * EXPORT SUMMARY
 *
 * Core Entities:
 * - User, UserProfile
 * - Trip, TripWithDetails, TripCreateRequest, TripUpdateRequest
 * - Flight, Hotel, Event, CarRental, Transportation, TravelItem
 * - TravelCompanion, TripCompanion, ItemCompanion, CompanionIndicator
 * - Voucher, VoucherAttachment
 *
 * API/Response:
 * - ApiResponse, ApiListResponse, ApiErrorResponse
 * - GetAllTripsResponse, CreateItemResponse
 *
 * Dashboard:
 * - DashboardItem, DashboardState, SidebarContent, GroupedDashboardItems
 * - FormState, ValidationError
 *
 * Constants & Utilities:
 * - ITEM_TYPES, TRANSPORT_METHODS, TRIP_PURPOSES, VOUCHER_TYPES
 * - TIMEZONE_LIST, CURRENCY_LIST
 * - Type guards: isFlight, isHotel, isEvent, isCarRental, isTransportation
 * - Validation rules for express-validator integration
 */
