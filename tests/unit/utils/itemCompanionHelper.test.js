/**
 * Unit Tests for utils/itemCompanionHelper.js
 * Tests the sortCompanions helper function
 */

/* eslint-env jest */

const { sortCompanions } = require('../../../utils/itemCompanionHelper');

describe('sortCompanions', () => {
  describe('Basic sorting', () => {
    it('should put self companion first', () => {
      const companions = [
        { name: 'Alice Smith', email: 'alice@example.com' },
        { name: 'Bob Jones', email: 'bob@example.com' },
        { name: 'Self User', email: 'self@example.com' },
      ];

      const result = sortCompanions(companions, 'self@example.com');

      expect(result[0].email).toBe('self@example.com');
      expect(result[0].name).toBe('Self User');
    });

    it('should sort others alphabetically by first name', () => {
      const companions = [
        { name: 'Zoe Adams', email: 'zoe@example.com' },
        { name: 'Alice Smith', email: 'alice@example.com' },
        { name: 'Bob Jones', email: 'bob@example.com' },
      ];

      const result = sortCompanions(companions, 'nonexistent@example.com');

      expect(result[0].name).toBe('Alice Smith');
      expect(result[1].name).toBe('Bob Jones');
      expect(result[2].name).toBe('Zoe Adams');
    });

    it('should put self first then sort others', () => {
      const companions = [
        { name: 'Zoe Adams', email: 'zoe@example.com' },
        { name: 'Self User', email: 'self@example.com' },
        { name: 'Alice Smith', email: 'alice@example.com' },
        { name: 'Bob Jones', email: 'bob@example.com' },
      ];

      const result = sortCompanions(companions, 'self@example.com');

      expect(result[0].name).toBe('Self User');
      expect(result[1].name).toBe('Alice Smith');
      expect(result[2].name).toBe('Bob Jones');
      expect(result[3].name).toBe('Zoe Adams');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const result = sortCompanions([], 'self@example.com');
      expect(result).toEqual([]);
    });

    it('should handle array with only self', () => {
      const companions = [{ name: 'Self User', email: 'self@example.com' }];

      const result = sortCompanions(companions, 'self@example.com');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('self@example.com');
    });

    it('should handle array without self', () => {
      const companions = [
        { name: 'Bob Jones', email: 'bob@example.com' },
        { name: 'Alice Smith', email: 'alice@example.com' },
      ];

      const result = sortCompanions(companions, 'nonexistent@example.com');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice Smith');
      expect(result[1].name).toBe('Bob Jones');
    });

    it('should handle single companion that is not self', () => {
      const companions = [{ name: 'Alice Smith', email: 'alice@example.com' }];

      const result = sortCompanions(companions, 'self@example.com');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('alice@example.com');
    });
  });

  describe('Name parsing', () => {
    it('should sort by first name only', () => {
      const companions = [
        { name: 'Bob Smith', email: 'bob@example.com' },
        { name: 'Alice Jones', email: 'alice@example.com' },
        { name: 'Alice Adams', email: 'alice2@example.com' },
      ];

      const result = sortCompanions(companions, 'none@example.com');

      // Both Alices should come before Bob
      expect(result[0].name.split(' ')[0]).toBe('Alice');
      expect(result[1].name.split(' ')[0]).toBe('Alice');
      expect(result[2].name.split(' ')[0]).toBe('Bob');
    });

    it('should handle single-word names', () => {
      const companions = [
        { name: 'Zoe', email: 'zoe@example.com' },
        { name: 'Alice', email: 'alice@example.com' },
      ];

      const result = sortCompanions(companions, 'none@example.com');

      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Zoe');
    });

    it('should handle names with multiple spaces', () => {
      const companions = [
        { name: 'Mary Jane Watson', email: 'mary@example.com' },
        { name: 'Alice Jane Smith', email: 'alice@example.com' },
      ];

      const result = sortCompanions(companions, 'none@example.com');

      expect(result[0].name).toBe('Alice Jane Smith');
      expect(result[1].name).toBe('Mary Jane Watson');
    });
  });

  describe('Case sensitivity', () => {
    it('should sort case-insensitively', () => {
      const companions = [
        { name: 'bob jones', email: 'bob@example.com' },
        { name: 'Alice Smith', email: 'alice@example.com' },
        { name: 'CHARLIE Brown', email: 'charlie@example.com' },
      ];

      const result = sortCompanions(companions, 'none@example.com');

      expect(result[0].name).toBe('Alice Smith');
      expect(result[1].name).toBe('bob jones');
      expect(result[2].name).toBe('CHARLIE Brown');
    });
  });

  describe('Data integrity', () => {
    it('should not modify original array', () => {
      const companions = [
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Alice', email: 'alice@example.com' },
      ];
      const original = [...companions];

      sortCompanions(companions, 'none@example.com');

      expect(companions).toEqual(original);
    });

    it('should preserve all companion properties', () => {
      const companions = [
        {
          id: 1,
          name: 'Bob Jones',
          email: 'bob@example.com',
          phone: '555-0001',
          extra: 'data',
        },
        {
          id: 2,
          name: 'Alice Smith',
          email: 'alice@example.com',
          phone: '555-0002',
          extra: 'info',
        },
      ];

      const result = sortCompanions(companions, 'none@example.com');

      expect(result[0]).toEqual(companions[1]);
      expect(result[1]).toEqual(companions[0]);
      expect(result[0].phone).toBe('555-0002');
      expect(result[0].extra).toBe('info');
    });

    it('should return same length array', () => {
      const companions = [
        { name: 'A', email: 'a@example.com' },
        { name: 'B', email: 'b@example.com' },
        { name: 'C', email: 'c@example.com' },
      ];

      const result = sortCompanions(companions, 'self@example.com');

      expect(result).toHaveLength(companions.length);
    });
  });
});
