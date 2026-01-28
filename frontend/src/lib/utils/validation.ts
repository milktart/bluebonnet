export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Required field validation
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

// Date validation
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Time validation (HH:MM format)
export function isValidTime(timeString: string): boolean {
  if (!timeString) return false;
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

// Flight validation
export function validateFlight(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isRequired(data.flightNumber)) {
    errors.push({ field: 'flightNumber', message: 'Flight number is required' });
  }

  if (!isRequired(data.origin)) {
    errors.push({ field: 'origin', message: 'Origin is required' });
  }

  if (!isRequired(data.destination)) {
    errors.push({ field: 'destination', message: 'Destination is required' });
  }

  if (!isRequired(data.departureDate) || !isValidDate(data.departureDate as string)) {
    errors.push({ field: 'departureDate', message: 'Valid departure date is required' });
  }

  if (!isRequired(data.departureTime) || !isValidTime(data.departureTime as string)) {
    errors.push({ field: 'departureTime', message: 'Valid departure time is required' });
  }

  if (!isRequired(data.arrivalDate) || !isValidDate(data.arrivalDate as string)) {
    errors.push({ field: 'arrivalDate', message: 'Valid arrival date is required' });
  }

  if (!isRequired(data.arrivalTime) || !isValidTime(data.arrivalTime as string)) {
    errors.push({ field: 'arrivalTime', message: 'Valid arrival time is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Hotel validation
export function validateHotel(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Accept both 'name' and 'hotelName' for backwards compatibility
  const hotelName = data.name || data.hotelName;
  if (!isRequired(hotelName)) {
    errors.push({ field: 'hotelName', message: 'Hotel name is required' });
  }

  if (!isRequired(data.address)) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  if (!isRequired(data.checkInDate) || !isValidDate(data.checkInDate as string)) {
    errors.push({ field: 'checkInDate', message: 'Valid check-in date is required' });
  }

  if (!isRequired(data.checkOutDate) || !isValidDate(data.checkOutDate as string)) {
    errors.push({ field: 'checkOutDate', message: 'Valid check-out date is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Event validation
export function validateEvent(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: 'Event name is required' });
  }

  if (!isRequired(data.location)) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (!isRequired(data.startDate) || !isValidDate(data.startDate as string)) {
    errors.push({ field: 'startDate', message: 'Valid start date is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Transportation validation
export function validateTransportation(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Accept both 'method' and 'type' for backwards compatibility
  const method = data.method || data.type;
  if (!isRequired(method)) {
    errors.push({ field: 'type', message: 'Transportation method is required' });
  }

  if (!isRequired(data.origin)) {
    errors.push({ field: 'origin', message: 'Origin is required' });
  }

  if (!isRequired(data.destination)) {
    errors.push({ field: 'destination', message: 'Destination is required' });
  }

  if (!isRequired(data.departureDate) || !isValidDate(data.departureDate as string)) {
    errors.push({ field: 'departureDate', message: 'Valid departure date is required' });
  }

  if (!isRequired(data.arrivalDate) || !isValidDate(data.arrivalDate as string)) {
    errors.push({ field: 'arrivalDate', message: 'Valid arrival date is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Car rental validation
export function validateCarRental(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isRequired(data.company)) {
    errors.push({ field: 'company', message: 'Company is required' });
  }

  if (!isRequired(data.pickupLocation)) {
    errors.push({ field: 'pickupLocation', message: 'Pickup location is required' });
  }

  if (!isRequired(data.dropoffLocation)) {
    errors.push({ field: 'dropoffLocation', message: 'Dropoff location is required' });
  }

  if (!isRequired(data.pickupDate) || !isValidDate(data.pickupDate as string)) {
    errors.push({ field: 'pickupDate', message: 'Valid pickup date is required' });
  }

  if (!isRequired(data.dropoffDate) || !isValidDate(data.dropoffDate as string)) {
    errors.push({ field: 'dropoffDate', message: 'Valid dropoff date is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Trip validation
export function validateTrip(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: 'Trip name is required' });
  }

  if (!isRequired(data.purpose)) {
    errors.push({ field: 'purpose', message: 'Trip purpose is required' });
  }

  if (!isRequired(data.departureDate) || !isValidDate(data.departureDate as string)) {
    errors.push({ field: 'departureDate', message: 'Valid departure date is required' });
  }

  if (!isRequired(data.returnDate) || !isValidDate(data.returnDate as string)) {
    errors.push({ field: 'returnDate', message: 'Valid return date is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generic validator by type
export function validateByType(
  type: string,
  data: Record<string, unknown>
): ValidationResult {
  switch (type.toLowerCase()) {
    case 'flight':
      return validateFlight(data);
    case 'hotel':
      return validateHotel(data);
    case 'event':
      return validateEvent(data);
    case 'transportation':
      return validateTransportation(data);
    case 'carRental':
    case 'car_rental':
      return validateCarRental(data);
    case 'trip':
      return validateTrip(data);
    default:
      return { isValid: true, errors: [] };
  }
}

/**
 * Enhanced validation utilities for common patterns
 */

// Compare two dates
export function isDateBefore(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1 < d2;
}

export function isDateAfter(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1 > d2;
}

export function isDateEqual(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getTime() === d2.getTime();
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Phone number validation (simple international format)
export function isValidPhone(phone: string): boolean {
  // Accepts various formats: +1-212-555-0123, 212-555-0123, +44 20 7946 0958, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Numeric validation
export function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return !isNaN(parseFloat(value)) && value.trim() !== '';
  return false;
}

// Length validation
export function hasMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

export function hasLengthBetween(value: string, min: number, max: number): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Field-level validation builder
 * Allows composing validation rules
 */
export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export function createValidationRules(rules: ValidationRule[]) {
  return {
    validate: (value: unknown): ValidationError | null => {
      for (const rule of rules) {
        if (!rule.validate(value)) {
          return { field: '', message: rule.message };
        }
      }
      return null;
    }
  };
}

// Common validation rule presets
export const validationRules = {
  required: {
    validate: isRequired,
    message: 'This field is required'
  },
  email: {
    validate: isValidEmail,
    message: 'Please enter a valid email address'
  },
  url: {
    validate: isValidUrl,
    message: 'Please enter a valid URL'
  },
  phone: {
    validate: isValidPhone,
    message: 'Please enter a valid phone number'
  },
  date: {
    validate: (v) => isValidDate(v as string),
    message: 'Please enter a valid date'
  },
  time: {
    validate: (v) => isValidTime(v as string),
    message: 'Please enter a valid time (HH:MM)'
  },
  numeric: {
    validate: isNumeric,
    message: 'Please enter a valid number'
  }
};

/**
 * Form-level validation with multiple fields
 */
export function validateFields(
  data: Record<string, unknown>,
  schema: Record<string, ValidationRule[]>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      if (!rule.validate(data[field])) {
        errors[field] = rule.message;
        break; // Show first error only
      }
    }
  }

  return errors;
}

/**
 * Check if form has validation errors
 */
export function hasErrors(errors: Record<string, string> | ValidationError[]): boolean {
  if (Array.isArray(errors)) {
    return errors.length > 0;
  }
  return Object.keys(errors).length > 0;
}

/**
 * Get first error message from field errors
 */
export function getFirstError(
  errors: Record<string, string> | ValidationError[]
): string | null {
  if (Array.isArray(errors)) {
    return errors.length > 0 ? errors[0].message : null;
  }
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}
