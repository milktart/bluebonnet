const dateFormatter = require('../../../utils/dateFormatter');

describe('DateFormatter', () => {
  describe('formatDate', () => {
    it('should format date as DD MMM YYYY', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = dateFormatter.formatDate(date);

      expect(result).toBe('15 Jan 2025');
    });

    it('should handle different months', () => {
      expect(dateFormatter.formatDate(new Date('2025-03-05'))).toBe('05 Mar 2025');
      expect(dateFormatter.formatDate(new Date('2025-12-25'))).toBe('25 Dec 2025');
    });

    it('should pad single-digit days', () => {
      const result = dateFormatter.formatDate(new Date('2025-01-05'));

      expect(result).toMatch(/^0\d/); // Should start with 0
    });

    it('should return empty string for invalid date', () => {
      expect(dateFormatter.formatDate(null)).toBe('');
      expect(dateFormatter.formatDate(undefined)).toBe('');
      expect(dateFormatter.formatDate('invalid')).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:MM in 24-hour format', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const result = dateFormatter.formatTime(date);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
      expect(result).not.toContain('AM');
      expect(result).not.toContain('PM');
    });

    it('should pad single-digit hours and minutes', () => {
      const date = new Date('2025-01-15T09:05:00Z');
      const result = dateFormatter.formatTime(date);

      expect(result).toMatch(/^0\d:0\d$/);
    });

    it('should return empty string for invalid date', () => {
      expect(dateFormatter.formatTime(null)).toBe('');
      expect(dateFormatter.formatTime(undefined)).toBe('');
      expect(dateFormatter.formatTime('invalid')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const result = dateFormatter.formatDateTime(date);

      expect(result).toContain('Jan 2025');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should return empty string for invalid date', () => {
      expect(dateFormatter.formatDateTime(null)).toBe('');
    });
  });

  describe('formatDateRange', () => {
    it('should format a date range', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-20');
      const result = dateFormatter.formatDateRange(startDate, endDate);

      expect(result).toContain('15 Jan 2025');
      expect(result).toContain('20 Jan 2025');
    });

    it('should handle same-day range', () => {
      const date = new Date('2025-01-15');
      const result = dateFormatter.formatDateRange(date, date);

      expect(result).toBeDefined();
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date string', () => {
      const result = dateFormatter.parseDate('2025-01-15');

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January is 0
    });

    it('should return null for invalid date string', () => {
      expect(dateFormatter.parseDate('invalid')).toBeNull();
      expect(dateFormatter.parseDate(null)).toBeNull();
      expect(dateFormatter.parseDate('')).toBeNull();
    });
  });
});
