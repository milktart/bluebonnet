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

  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: 'Hotel name is required' });
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

  if (!isRequired(data.method)) {
    errors.push({ field: 'method', message: 'Transportation method is required' });
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
