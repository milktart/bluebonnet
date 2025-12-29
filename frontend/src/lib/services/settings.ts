/**
 * Settings API Service
 * Handles all account settings related API calls
 * Note: Account routes are mounted at /account (not /api/account)
 */

// Helper function to get base URL for account routes (no /api prefix)
function getAccountBase(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    if (port === '5173') {
      return `${protocol}//${hostname}:3501`;
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000`;
    } else {
      return `${protocol}//${hostname}:3501`;
    }
  }
  return 'http://localhost:3000';
}

export const settingsApi = {
  /**
   * Update user profile (firstName, lastName, email)
   */
  async updateProfile(data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/account/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Change user password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/account/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to change password: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get all vouchers
   */
  async getVouchers(): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/vouchers`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vouchers: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get voucher details
   */
  async getVoucherDetails(voucherId: string): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/account/vouchers/${voucherId}/details`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voucher details: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new voucher
   */
  async createVoucher(data: any): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/vouchers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to create voucher: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update a voucher
   */
  async updateVoucher(voucherId: string, data: any): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/vouchers/${voucherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to update voucher: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete a voucher
   */
  async deleteVoucher(voucherId: string): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/vouchers/${voucherId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete voucher: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get all travel companions (companions you've created and people who added you)
   */
  async getCompanions(): Promise<any> {
    const base = getAccountBase();

    // Fetch companions you created
    const companionsResponse = await fetch(`${base}/companions/api/json`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!companionsResponse.ok) {
      throw new Error(`Failed to fetch companions: ${companionsResponse.statusText}`);
    }

    const companionsData = await companionsResponse.json();

    // For now, return only the companions you created
    // The backend doesn't have a dedicated endpoint for "people who added you"
    // This would need to be implemented if needed
    return companionsData;
  },

  /**
   * Get all companions with bidirectional relationship info
   */
  async getAllCompanions(): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/companions/api/all`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all companions: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new travel companion
   */
  async createCompanion(data: any): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/companions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Mark as AJAX request
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to create companion: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update a travel companion
   */
  async updateCompanion(companionId: string, data: any): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/companions/${companionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Mark as AJAX request
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to update companion: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Remove a travel companion
   */
  async removeCompanion(companionId: string): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/companions/${companionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to remove companion: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Revoke companion access to your profile
   */
  async revokeCompanionAccess(companionId: string): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/account/companions/${companionId}/revoke`, {
      method: 'PUT',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke companion access: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Export all user data as JSON
   */
  async exportData(): Promise<Blob> {
    const base = getAccountBase();
    const response = await fetch(`${base}/account/export`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Get import preview for a JSON file
   */
  async previewImport(file: File): Promise<any> {
    const base = getAccountBase();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${base}/account/data/preview`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = 'Failed to preview import';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  /**
   * Import selected items from JSON
   */
  async importData(selectedItems: any): Promise<any> {
    const base = getAccountBase();
    const response = await fetch(`${base}/account/data/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selectedItems),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to import data: ${response.statusText}`);
    }

    return response.json();
  }
};
