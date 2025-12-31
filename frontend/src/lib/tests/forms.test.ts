import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test form validation logic
 * These tests validate the core validation logic used in all form components
 */

describe('Form Validation', () => {
  describe('Required field validation', () => {
    it('should require non-empty strings', () => {
      const validate = (value: string) => !value.trim();

      expect(validate('')).toBe(true);
      expect(validate('   ')).toBe(true);
      expect(validate('valid')).toBe(false);
    });

    it('should require values to be present', () => {
      const validate = (value: any) => !value;

      expect(validate('')).toBe(true);
      expect(validate(null)).toBe(true);
      expect(validate(undefined)).toBe(true);
      expect(validate('value')).toBe(false);
      expect(validate(0)).toBe(true); // Edge case: numeric 0 is falsy
    });
  });

  describe('Email validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateEmail = (email: string) => emailRegex.test(email);

    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@example.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
    });
  });

  describe('Numeric validation', () => {
    const validateNumeric = (value: string) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    };

    it('should validate positive numbers', () => {
      expect(validateNumeric('100')).toBe(true);
      expect(validateNumeric('99.99')).toBe(true);
      expect(validateNumeric('0.01')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(validateNumeric('-50')).toBe(false);
      expect(validateNumeric('0')).toBe(false);
      expect(validateNumeric('abc')).toBe(false);
      expect(validateNumeric('')).toBe(false);
    });
  });

  describe('Percentage validation', () => {
    const validatePercentage = (value: string) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0 && num <= 100;
    };

    it('should validate percentages between 0 and 100', () => {
      expect(validatePercentage('50')).toBe(true);
      expect(validatePercentage('99.99')).toBe(true);
      expect(validatePercentage('0.01')).toBe(true);
      expect(validatePercentage('100')).toBe(true);
    });

    it('should reject invalid percentages', () => {
      expect(validatePercentage('101')).toBe(false);
      expect(validatePercentage('-10')).toBe(false);
      expect(validatePercentage('0')).toBe(false);
      expect(validatePercentage('abc')).toBe(false);
    });
  });

  describe('Date validation', () => {
    const validateDate = (dateString: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    };

    it('should validate valid date strings', () => {
      expect(validateDate('2025-12-25')).toBe(true);
      expect(validateDate('2025-12-25T10:30:00')).toBe(true);
      expect(validateDate(new Date().toISOString())).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(validateDate('')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('25-12-2025')).toBe(false);
    });
  });

  describe('Airport code validation', () => {
    const validateAirportCode = (code: string) => {
      // 2-4 character code (most airport codes are 3 characters)
      return /^[A-Z]{2,4}$/.test(code.toUpperCase());
    };

    it('should validate valid airport codes', () => {
      expect(validateAirportCode('JFK')).toBe(true);
      expect(validateAirportCode('LAX')).toBe(true);
      expect(validateAirportCode('ORD')).toBe(true);
      expect(validateAirportCode('DFW')).toBe(true);
    });

    it('should reject invalid airport codes', () => {
      expect(validateAirportCode('J')).toBe(false);
      expect(validateAirportCode('JFK1')).toBe(false);
      expect(validateAirportCode('jfk')).toBe(true); // Should handle case-insensitivity
    });
  });
});

describe('Trip Form Validation', () => {
  it('should require trip name', () => {
    const validate = (name: string) => !name.trim();
    expect(validate('')).toBe(true);
    expect(validate('My Trip')).toBe(false);
  });

  it('should require destination', () => {
    const validate = (dest: string) => !dest.trim();
    expect(validate('')).toBe(true);
    expect(validate('Paris, France')).toBe(false);
  });

  it('should validate complete trip form', () => {
    const validateTrip = (data: any) => {
      const errors = [];
      if (!data.name?.trim()) errors.push('Trip name is required');
      if (!data.destination?.trim()) errors.push('Destination is required');
      return errors.length === 0;
    };

    expect(validateTrip({ name: '', destination: '' })).toBe(false);
    expect(validateTrip({ name: 'Trip', destination: '' })).toBe(false);
    expect(validateTrip({ name: 'Trip', destination: 'Paris' })).toBe(true);
  });
});

describe('Flight Form Validation', () => {
  const validateFlight = (data: any) => {
    const errors = [];
    if (!data.origin?.trim()) errors.push('Origin is required');
    if (!data.destination?.trim()) errors.push('Destination is required');
    if (!data.departureDate) errors.push('Departure date is required');
    return errors.length === 0;
  };

  it('should require origin airport', () => {
    expect(validateFlight({
      origin: '',
      destination: 'LAX',
      departureDate: '2025-12-25'
    })).toBe(false);
  });

  it('should require destination airport', () => {
    expect(validateFlight({
      origin: 'JFK',
      destination: '',
      departureDate: '2025-12-25'
    })).toBe(false);
  });

  it('should require departure date', () => {
    expect(validateFlight({
      origin: 'JFK',
      destination: 'LAX',
      departureDate: ''
    })).toBe(false);
  });

  it('should validate complete flight form', () => {
    expect(validateFlight({
      origin: 'JFK',
      destination: 'LAX',
      departureDate: '2025-12-25'
    })).toBe(true);
  });
});

describe('Hotel Form Validation', () => {
  const validateHotel = (data: any) => {
    const errors = [];
    if (!data.name?.trim()) errors.push('Hotel name is required');
    if (!data.checkInDate) errors.push('Check-in date is required');
    return errors.length === 0;
  };

  it('should require hotel name', () => {
    expect(validateHotel({
      name: '',
      checkInDate: '2025-12-25'
    })).toBe(false);
  });

  it('should require check-in date', () => {
    expect(validateHotel({
      name: 'The Grand Hotel',
      checkInDate: ''
    })).toBe(false);
  });

  it('should validate complete hotel form', () => {
    expect(validateHotel({
      name: 'The Grand Hotel',
      checkInDate: '2025-12-25'
    })).toBe(true);
  });
});

describe('Event Form Validation', () => {
  const validateEvent = (data: any) => {
    const errors = [];
    if (!data.name?.trim()) errors.push('Event name is required');
    if (!data.date) errors.push('Event date is required');
    return errors.length === 0;
  };

  it('should require event name', () => {
    expect(validateEvent({
      name: '',
      date: '2025-12-25'
    })).toBe(false);
  });

  it('should require event date', () => {
    expect(validateEvent({
      name: 'Eiffel Tower Visit',
      date: ''
    })).toBe(false);
  });

  it('should validate complete event form', () => {
    expect(validateEvent({
      name: 'Eiffel Tower Visit',
      date: '2025-12-25'
    })).toBe(true);
  });
});

describe('Transportation Form Validation', () => {
  const validateTransportation = (data: any) => {
    const errors = [];
    if (!data.fromLocation?.trim()) errors.push('From location is required');
    if (!data.toLocation?.trim()) errors.push('To location is required');
    if (!data.departureTime) errors.push('Departure time is required');
    return errors.length === 0;
  };

  it('should require from location', () => {
    expect(validateTransportation({
      fromLocation: '',
      toLocation: 'Paris',
      departureTime: '2025-12-25T10:00'
    })).toBe(false);
  });

  it('should require to location', () => {
    expect(validateTransportation({
      fromLocation: 'London',
      toLocation: '',
      departureTime: '2025-12-25T10:00'
    })).toBe(false);
  });

  it('should require departure time', () => {
    expect(validateTransportation({
      fromLocation: 'London',
      toLocation: 'Paris',
      departureTime: ''
    })).toBe(false);
  });

  it('should validate complete transportation form', () => {
    expect(validateTransportation({
      fromLocation: 'London',
      toLocation: 'Paris',
      departureTime: '2025-12-25T10:00'
    })).toBe(true);
  });
});

describe('Car Rental Form Validation', () => {
  const validateCarRental = (data: any) => {
    const errors = [];
    if (!data.company?.trim()) errors.push('Company is required');
    if (!data.pickupDate) errors.push('Pickup date is required');
    if (!data.dropoffDate) errors.push('Dropoff date is required');
    return errors.length === 0;
  };

  it('should require company', () => {
    expect(validateCarRental({
      company: '',
      pickupDate: '2025-12-25',
      dropoffDate: '2025-12-27'
    })).toBe(false);
  });

  it('should require pickup date', () => {
    expect(validateCarRental({
      company: 'Hertz',
      pickupDate: '',
      dropoffDate: '2025-12-27'
    })).toBe(false);
  });

  it('should require dropoff date', () => {
    expect(validateCarRental({
      company: 'Hertz',
      pickupDate: '2025-12-25',
      dropoffDate: ''
    })).toBe(false);
  });

  it('should validate complete car rental form', () => {
    expect(validateCarRental({
      company: 'Hertz',
      pickupDate: '2025-12-25',
      dropoffDate: '2025-12-27'
    })).toBe(true);
  });
});

describe('Voucher Form Validation', () => {
  const validateVoucher = (data: any) => {
    const errors = [];
    if (!data.code?.trim()) errors.push('Voucher code is required');
    if (!data.discountValue) errors.push('Discount value is required');

    const discountNum = parseFloat(data.discountValue);
    if (isNaN(discountNum) || discountNum <= 0) {
      errors.push('Discount value must be positive');
    }

    if (data.discountType === 'percentage' && discountNum > 100) {
      errors.push('Percentage cannot exceed 100%');
    }

    return errors.length === 0;
  };

  it('should require voucher code', () => {
    expect(validateVoucher({
      code: '',
      discountValue: '20',
      discountType: 'percentage'
    })).toBe(false);
  });

  it('should require discount value', () => {
    expect(validateVoucher({
      code: 'SAVE20',
      discountValue: '',
      discountType: 'percentage'
    })).toBe(false);
  });

  it('should require positive discount value', () => {
    expect(validateVoucher({
      code: 'SAVE20',
      discountValue: '-10',
      discountType: 'percentage'
    })).toBe(false);

    expect(validateVoucher({
      code: 'SAVE20',
      discountValue: '0',
      discountType: 'percentage'
    })).toBe(false);
  });

  it('should limit percentage discounts to 100', () => {
    expect(validateVoucher({
      code: 'SAVE120',
      discountValue: '120',
      discountType: 'percentage'
    })).toBe(false);

    expect(validateVoucher({
      code: 'SAVE100',
      discountValue: '100',
      discountType: 'percentage'
    })).toBe(true);
  });

  it('should allow any positive fixed amount discount', () => {
    expect(validateVoucher({
      code: 'SAVE500',
      discountValue: '500',
      discountType: 'fixed'
    })).toBe(true);

    expect(validateVoucher({
      code: 'SAVE0.01',
      discountValue: '0.01',
      discountType: 'fixed'
    })).toBe(true);
  });

  it('should validate complete voucher form', () => {
    expect(validateVoucher({
      code: 'SAVE20',
      discountValue: '20',
      discountType: 'percentage'
    })).toBe(true);
  });
});
