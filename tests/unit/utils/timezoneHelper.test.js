const timezoneHelper = require('../../../utils/timezoneHelper');

describe('TimezoneHelper', () => {
  describe('convertToTimezone', () => {
    it('should convert UTC time to specific timezone', () => {
      const utcDate = new Date('2025-01-15T12:00:00Z');
      const result = timezoneHelper.convertToTimezone(utcDate, 'America/New_York');

      expect(result).toBeInstanceOf(Date);
      // New York is UTC-5, so 12:00 UTC should be 07:00 EST
      expect(result.getHours()).toBeLessThan(12);
    });

    it('should handle different timezones', () => {
      const utcDate = new Date('2025-01-15T12:00:00Z');

      const la = timezoneHelper.convertToTimezone(utcDate, 'America/Los_Angeles');
      const tokyo = timezoneHelper.convertToTimezone(utcDate, 'Asia/Tokyo');

      expect(la).toBeInstanceOf(Date);
      expect(tokyo).toBeInstanceOf(Date);
      expect(la.getTime()).not.toBe(tokyo.getTime());
    });

    it('should return original date for invalid timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = timezoneHelper.convertToTimezone(date, 'Invalid/Timezone');

      // Should fallback to original date or handle gracefully
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return timezone offset', () => {
      const offset = timezoneHelper.getTimezoneOffset('America/New_York', new Date('2025-01-15'));

      expect(typeof offset).toBe('number');
      expect(offset).toBe(-5 * 60); // -5 hours in minutes
    });

    it('should handle daylight saving time', () => {
      // Summer date (DST active)
      const summerOffset = timezoneHelper.getTimezoneOffset(
        'America/New_York',
        new Date('2025-07-15')
      );
      // Winter date (DST inactive)
      const winterOffset = timezoneHelper.getTimezoneOffset(
        'America/New_York',
        new Date('2025-01-15')
      );

      expect(summerOffset).not.toBe(winterOffset);
    });
  });

  describe('formatInTimezone', () => {
    it('should format date in specified timezone', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = timezoneHelper.formatInTimezone(
        date,
        'America/Los_Angeles',
        'DD MMM YYYY HH:MM'
      );

      expect(typeof result).toBe('string');
      expect(result).toMatch(/Jan 2025/);
    });

    it('should handle different format strings', () => {
      const date = new Date('2025-01-15T12:00:00Z');

      const dateOnly = timezoneHelper.formatInTimezone(date, 'UTC', 'DD MMM YYYY');
      const timeOnly = timezoneHelper.formatInTimezone(date, 'UTC', 'HH:MM');

      expect(dateOnly).toContain('Jan 2025');
      expect(timeOnly).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('isValidTimezone', () => {
    it('should validate correct timezone names', () => {
      expect(timezoneHelper.isValidTimezone('America/New_York')).toBe(true);
      expect(timezoneHelper.isValidTimezone('Europe/London')).toBe(true);
      expect(timezoneHelper.isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(timezoneHelper.isValidTimezone('UTC')).toBe(true);
    });

    it('should reject invalid timezone names', () => {
      expect(timezoneHelper.isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(timezoneHelper.isValidTimezone('')).toBe(false);
      expect(timezoneHelper.isValidTimezone(null)).toBe(false);
      expect(timezoneHelper.isValidTimezone(undefined)).toBe(false);
    });
  });
});
