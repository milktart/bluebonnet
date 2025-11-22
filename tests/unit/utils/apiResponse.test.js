const { success, error, paginated } = require('../../../utils/apiResponse');

describe('API Response Utilities', () => {
  describe('success', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const result = success(data);

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
      });
    });

    it('should create a success response with message', () => {
      const result = success({ id: 1 }, 'Operation completed');

      expect(result).toEqual({
        success: true,
        data: { id: 1 },
        message: 'Operation completed',
      });
    });

    it('should handle null data', () => {
      const result = success(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('error', () => {
    it('should create an error response with message', () => {
      const result = error('Something went wrong');

      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
      });
    });

    it('should include status code if provided', () => {
      const result = error('Not found', 404);

      expect(result).toEqual({
        success: false,
        error: 'Not found',
        statusCode: 404,
      });
    });

    it('should handle Error objects', () => {
      const err = new Error('Test error');
      const result = error(err.message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('paginated', () => {
    it('should create a paginated response', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = paginated(items, 1, 10, 23);

      expect(result).toEqual({
        success: true,
        data: items,
        pagination: {
          page: 1,
          limit: 10,
          total: 23,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should calculate total pages correctly', () => {
      const result = paginated([], 1, 10, 25);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('should set hasNext and hasPrev correctly', () => {
      const middlePage = paginated([], 2, 10, 50);

      expect(middlePage.pagination.hasNext).toBe(true);
      expect(middlePage.pagination.hasPrev).toBe(true);

      const lastPage = paginated([], 5, 10, 50);

      expect(lastPage.pagination.hasNext).toBe(false);
      expect(lastPage.pagination.hasPrev).toBe(true);
    });

    it('should handle empty results', () => {
      const result = paginated([], 1, 10, 0);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
