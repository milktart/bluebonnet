/**
 * Zod Validation Schemas
 * Shared validation schemas for all API request/response types
 * Used for both frontend and backend validation
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS (Date, UUID, etc.)
// ============================================================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const DateTimeSchema = z.string().datetime('Invalid datetime format');
export const DateSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  'Invalid date format (ISO 8601 required)'
);
export const EmailSchema = z.string().email('Invalid email address');
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timezone: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const UserCreateSchema = z.object({
  email: EmailSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: PasswordSchema,
  timezone: z.string().optional(),
});

export const UserUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  timezone: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const UserLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// TRIP SCHEMAS
// ============================================================================

export const TripSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  name: z.string().min(1, 'Trip name is required').max(255, 'Trip name is too long'),
  description: z.string().optional(),
  departureDate: DateTimeSchema,
  returnDate: DateTimeSchema.optional(),
  isPrivate: z.boolean().default(false),
  color: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const TripCreateSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(255, 'Trip name is too long'),
  description: z.string().optional(),
  departureDate: DateTimeSchema,
  returnDate: DateTimeSchema.optional(),
  isPrivate: z.boolean().default(false),
  color: z.string().optional(),
});

export const TripUpdateSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(255).optional(),
  description: z.string().optional(),
  departureDate: DateTimeSchema.optional(),
  returnDate: DateTimeSchema.optional(),
  isPrivate: z.boolean().optional(),
  color: z.string().optional(),
});

// ============================================================================
// FLIGHT SCHEMAS
// ============================================================================

export const FlightSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  tripId: UUIDSchema.optional(),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  origin: z.string().length(3, 'Origin must be 3-letter airport code').toUpperCase(),
  destination: z.string().length(3, 'Destination must be 3-letter airport code').toUpperCase(),
  departureDateTime: DateTimeSchema,
  arrivalDateTime: DateTimeSchema,
  aircraft: z.string().optional(),
  seatNumber: z.string().optional(),
  bookingReference: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const FlightCreateSchema = z.object({
  tripId: UUIDSchema.optional(),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  origin: z.string().length(3, 'Origin must be 3-letter airport code').toUpperCase(),
  destination: z.string().length(3, 'Destination must be 3-letter airport code').toUpperCase(),
  departureDateTime: DateTimeSchema,
  arrivalDateTime: DateTimeSchema,
  aircraft: z.string().optional(),
  seatNumber: z.string().optional(),
  bookingReference: z.string().optional(),
  notes: z.string().optional(),
});

export const FlightUpdateSchema = z.object({
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
  origin: z.string().length(3).toUpperCase().optional(),
  destination: z.string().length(3).toUpperCase().optional(),
  departureDateTime: DateTimeSchema.optional(),
  arrivalDateTime: DateTimeSchema.optional(),
  aircraft: z.string().optional(),
  seatNumber: z.string().optional(),
  bookingReference: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// HOTEL SCHEMAS
// ============================================================================

export const HotelSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  tripId: UUIDSchema.optional(),
  name: z.string().min(1, 'Hotel name is required'),
  city: z.string().optional(),
  address: z.string().optional(),
  checkInDate: DateTimeSchema,
  checkOutDate: DateTimeSchema,
  roomType: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const HotelCreateSchema = z.object({
  tripId: UUIDSchema.optional(),
  name: z.string().min(1, 'Hotel name is required'),
  city: z.string().optional(),
  address: z.string().optional(),
  checkInDate: DateTimeSchema,
  checkOutDate: DateTimeSchema,
  roomType: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const HotelUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  checkInDate: DateTimeSchema.optional(),
  checkOutDate: DateTimeSchema.optional(),
  roomType: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const EventSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  tripId: UUIDSchema.optional(),
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  startDateTime: DateTimeSchema,
  endDateTime: DateTimeSchema.optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const EventCreateSchema = z.object({
  tripId: UUIDSchema.optional(),
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  startDateTime: DateTimeSchema,
  endDateTime: DateTimeSchema.optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const EventUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDateTime: DateTimeSchema.optional(),
  endDateTime: DateTimeSchema.optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// TRANSPORTATION SCHEMAS
// ============================================================================

export const TransportationSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  tripId: UUIDSchema.optional(),
  type: z.enum(['bus', 'train', 'taxi', 'shuttle', 'other']),
  provider: z.string().optional(),
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
  departureDateTime: DateTimeSchema,
  arrivalDateTime: DateTimeSchema.optional(),
  bookingReference: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const TransportationCreateSchema = z.object({
  tripId: UUIDSchema.optional(),
  type: z.enum(['bus', 'train', 'taxi', 'shuttle', 'other']),
  provider: z.string().optional(),
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
  departureDateTime: DateTimeSchema,
  arrivalDateTime: DateTimeSchema.optional(),
  bookingReference: z.string().optional(),
  notes: z.string().optional(),
});

export const TransportationUpdateSchema = z.object({
  type: z.enum(['bus', 'train', 'taxi', 'shuttle', 'other']).optional(),
  provider: z.string().optional(),
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
  departureDateTime: DateTimeSchema.optional(),
  arrivalDateTime: DateTimeSchema.optional(),
  bookingReference: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CAR RENTAL SCHEMAS
// ============================================================================

export const CarRentalSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  tripId: UUIDSchema.optional(),
  company: z.string().min(1, 'Company name is required'),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  pickupDateTime: DateTimeSchema,
  dropoffDateTime: DateTimeSchema,
  vehicleType: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const CarRentalCreateSchema = z.object({
  tripId: UUIDSchema.optional(),
  company: z.string().min(1, 'Company name is required'),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  pickupDateTime: DateTimeSchema,
  dropoffDateTime: DateTimeSchema,
  vehicleType: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const CarRentalUpdateSchema = z.object({
  company: z.string().min(1).optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  pickupDateTime: DateTimeSchema.optional(),
  dropoffDateTime: DateTimeSchema.optional(),
  vehicleType: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// COMPANION SCHEMAS
// ============================================================================

export const CompanionSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  name: z.string().min(1, 'Companion name is required'),
  email: EmailSchema.optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const CompanionCreateSchema = z.object({
  name: z.string().min(1, 'Companion name is required'),
  email: EmailSchema.optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const CompanionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: EmailSchema.optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// TRIP COMPANION SCHEMAS
// ============================================================================

export const TripCompanionSchema = z.object({
  id: UUIDSchema,
  tripId: UUIDSchema,
  companionId: UUIDSchema,
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  joinedAt: DateTimeSchema,
});

export const TripCompanionCreateSchema = z.object({
  companionId: UUIDSchema,
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
});

// ============================================================================
// ITEM COMPANION SCHEMAS
// ============================================================================

export const ItemCompanionSchema = z.object({
  id: UUIDSchema,
  itemId: UUIDSchema,
  itemType: z.enum(['Flight', 'Hotel', 'Event', 'Transportation', 'CarRental']),
  companionId: UUIDSchema,
  status: z.enum(['invited', 'accepted', 'declined']).default('invited'),
  addedAt: DateTimeSchema,
});

export const ItemCompanionCreateSchema = z.object({
  itemId: UUIDSchema,
  itemType: z.enum(['Flight', 'Hotel', 'Event', 'Transportation', 'CarRental']),
  companionId: UUIDSchema,
});

// ============================================================================
// VOUCHER SCHEMAS
// ============================================================================

export const VoucherSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  itemId: UUIDSchema.optional(),
  itemType: z.enum(['Flight', 'Hotel', 'Event', 'Transportation', 'CarRental']).optional(),
  code: z.string().min(1, 'Voucher code is required'),
  description: z.string().optional(),
  expiryDate: DateTimeSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const VoucherCreateSchema = z.object({
  itemId: UUIDSchema.optional(),
  itemType: z.enum(['Flight', 'Hotel', 'Event', 'Transportation', 'CarRental']).optional(),
  code: z.string().min(1, 'Voucher code is required'),
  description: z.string().optional(),
  expiryDate: DateTimeSchema.optional(),
});

export const VoucherUpdateSchema = z.object({
  itemId: UUIDSchema.optional(),
  itemType: z.enum(['Flight', 'Hotel', 'Event', 'Transportation', 'CarRental']).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  expiryDate: DateTimeSchema.optional(),
});

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const PaginationResponseSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  totalItems: z.number().int().min(0),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string(),
  pagination: PaginationResponseSchema.optional(),
  errors: z.array(z.unknown()).optional(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.unknown()).optional(),
});
