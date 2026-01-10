<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from './Alert.svelte';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  let permissions: any[] = [];
  let loading = true;
  let error: string | null = null;
  let successMessage: string | null = null;
  let searchEmail = '';
  let isSearching = false;
  let searchResults: any[] = [];
  let showAddForm = false;
  let selectedUserId: string | null = null;
  let canManageAllTrips = true;
  let canViewAllTrips = true;

  onMount(async () => {
    await loadPermissions();
  });

  async function loadPermissions() {
    try {
      loading = true;
      error = null;
      const response = await settingsApi.getGrantedPermissions();
      permissions = Array.isArray(response) ? response : response?.permissions || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load permissions';
    } finally {
      loading = false;
    }
  }

  async function handleSearchUsers() {
    if (!searchEmail.trim()) {
      searchResults = [];
      return;
    }

    try {
      isSearching = true;
      error = null;

      // Call API to search users by email
      // This would need a dedicated endpoint - for now using getAllUsers
      const base = typeof window !== 'undefined'
        ? window.location.hostname === 'localhost'
          ? `${window.location.protocol}//localhost:3000`
          : ''
        : 'http://localhost:3000';

      const response = await fetch(`${base}/api/v1/users/search?email=${encodeURIComponent(searchEmail)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      searchResults = Array.isArray(data) ? data : data?.users || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to search users';
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }

  async function handleSelectUser(user: any) {
    selectedUserId = user.id;
    searchResults = [];
    searchEmail = `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  async function handleGrantPermission() {
    if (!selectedUserId) {
      error = 'Please select a user';
      return;
    }

    try {
      loading = true;
      error = null;

      await settingsApi.grantPermission({
        trustedUserId: selectedUserId,
        canManageAllTrips,
        canViewAllTrips,
      });

      successMessage = 'Permission granted successfully';
      showAddForm = false;
      searchEmail = '';
      selectedUserId = null;
      canManageAllTrips = true;
      canViewAllTrips = true;
      await loadPermissions();

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to grant permission';
    } finally {
      loading = false;
    }
  }

  async function handleUpdatePermission(userId: string, manage: boolean, view: boolean) {
    try {
      loading = true;
      error = null;

      await settingsApi.updatePermission(userId, {
        canManageAllTrips: manage,
        canViewAllTrips: view,
      });

      successMessage = 'Permission updated successfully';
      await loadPermissions();

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update permission';
    } finally {
      loading = false;
    }
  }

  async function handleRevokePermission(userId: string) {
    try {
      loading = true;
      error = null;

      await settingsApi.revokePermission(userId);

      successMessage = 'Permission revoked successfully';
      await loadPermissions();

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to revoke permission';
    } finally {
      loading = false;
    }
  }

  function getDisplayName(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return user.email;
  }
</script>

<div class="trusted-companions-container">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if successMessage}
    <Alert type="success" message={successMessage} dismissible />
  {/if}

  <div class="section-header">
    <h3>People Who Can Manage Your Trips</h3>
    <button
      class="add-btn"
      on:click={() => (showAddForm = !showAddForm)}
      disabled={loading}
    >
      + Grant Access
    </button>
  </div>

  {#if showAddForm}
    <div class="add-permission-section">
      <h4>Grant Full Access to a User</h4>

      <div class="form-group">
        <label for="email-search">Search by Email</label>
        <div class="search-input-wrapper">
          <input
            id="email-search"
            type="email"
            placeholder="Search user by email..."
            bind:value={searchEmail}
            on:input={handleSearchUsers}
            disabled={loading || isSearching}
            class="form-input"
          />
          {#if isSearching}
            <span class="loading-indicator">Searching...</span>
          {/if}
        </div>

        {#if searchResults.length > 0}
          <div class="search-results">
            {#each searchResults as user (user.id)}
              <button
                class="result-item"
                on:click={() => handleSelectUser(user)}
                disabled={loading}
              >
                <div class="result-name">{getDisplayName(user)}</div>
                <div class="result-email">{user.email}</div>
              </button>
            {/each}
          </div>
        {/if}

        {#if selectedUserId}
          <div class="selected-user">
            <span>✓ {searchEmail}</span>
            <button
              class="clear-btn"
              on:click={() => {
                selectedUserId = null;
                searchEmail = '';
                searchResults = [];
              }}
            >
              Clear
            </button>
          </div>
        {/if}
      </div>

      <div class="permissions-checkboxes">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={canManageAllTrips}
            disabled={loading}
          />
          <span>Can manage all my trips (create, edit, delete)</span>
        </label>
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={canViewAllTrips}
            disabled={loading}
          />
          <span>Can view all my trips (read-only)</span>
        </label>
      </div>

      <div class="form-actions">
        <button
          class="grant-btn"
          on:click={handleGrantPermission}
          disabled={loading || !selectedUserId}
        >
          {loading ? 'Granting...' : 'Grant Access'}
        </button>
        <button
          class="cancel-btn"
          on:click={() => {
            showAddForm = false;
            searchEmail = '';
            selectedUserId = null;
            searchResults = [];
          }}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}

  {#if loading && permissions.length === 0}
    <div class="loading-state">
      <span class="material-symbols-outlined">hourglass_empty</span>
      <p>Loading permissions...</p>
    </div>
  {:else if permissions.length > 0}
    <div class="permissions-list">
      {#each permissions as permission (permission.trustedUserId)}
        <div class="permission-item">
          <div class="user-info">
            <div class="user-name">{getDisplayName(permission.trustedUser)}</div>
            <div class="user-email">{permission.trustedUser.email}</div>
          </div>
          <div class="permission-controls">
            <label class="permission-checkbox">
              <input
                type="checkbox"
                checked={permission.canManageAllTrips}
                on:change={(e) =>
                  handleUpdatePermission(
                    permission.trustedUserId,
                    e.currentTarget.checked,
                    permission.canViewAllTrips
                  )}
                disabled={loading}
              />
              <span>Manage</span>
            </label>
            <label class="permission-checkbox">
              <input
                type="checkbox"
                checked={permission.canViewAllTrips}
                on:change={(e) =>
                  handleUpdatePermission(
                    permission.trustedUserId,
                    permission.canManageAllTrips,
                    e.currentTarget.checked
                  )}
                disabled={loading}
              />
              <span>View</span>
            </label>
            <button
              class="revoke-btn"
              on:click={() => handleRevokePermission(permission.trustedUserId)}
              disabled={loading}
              title="Revoke access"
            >
              ✕
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <span class="material-symbols-outlined">person_add</span>
      <p>No trusted companions yet</p>
      <p class="empty-description">
        Grant full access to someone you trust to manage all your trips
      </p>
    </div>
  {/if}
</div>

<style>
  .trusted-companions-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1f2937;
    font-weight: 600;
  }

  .add-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.425rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .add-btn:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .add-btn:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }

  .add-permission-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.425rem;
  }

  .add-permission-section h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #374151;
    font-weight: 600;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .form-input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    font-size: 0.85rem;
    color: #111827;
    background-color: #ffffff;
    font-family: inherit;
    box-sizing: border-box;
    transition: all 0.15s;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .loading-indicator {
    position: absolute;
    right: 0.75rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .search-results {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    border: 1px solid #d1d5db;
    border-radius: 0.325rem;
    overflow: hidden;
    background-color: white;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    background-color: white;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.15s;
    text-align: left;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .result-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .result-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: #111827;
  }

  .result-email {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .selected-user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background-color: #dbeafe;
    border: 1px solid #bfdbfe;
    border-radius: 0.325rem;
    font-size: 0.85rem;
    color: #1e40af;
  }

  .clear-btn {
    padding: 0.25rem 0.5rem;
    background-color: transparent;
    color: #1e40af;
    border: 1px solid #1e40af;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .clear-btn:hover {
    background-color: #eff6ff;
  }

  .permissions-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #374151;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-label input {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: #3b82f6;
  }

  .checkbox-label input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .grant-btn {
    flex: 1;
    padding: 0.625rem;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 0.425rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .grant-btn:hover:not(:disabled) {
    background-color: #059669;
  }

  .grant-btn:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }

  .cancel-btn {
    flex: 1;
    padding: 0.625rem;
    background-color: #e5e7eb;
    color: #374151;
    border: none;
    border-radius: 0.425rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .cancel-btn:hover:not(:disabled) {
    background-color: #d1d5db;
  }

  .cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
  }

  .loading-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .permissions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    overflow: hidden;
  }

  .permission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.15s;
  }

  .permission-item:last-child {
    border-bottom: none;
  }

  .permission-item:hover {
    background-color: #f9fafb;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  .user-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: #111827;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-email {
    font-size: 0.75rem;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .permission-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .permission-checkbox {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: #6b7280;
    cursor: pointer;
    user-select: none;
  }

  .permission-checkbox input {
    width: 0.95rem;
    height: 0.95rem;
    cursor: pointer;
    accent-color: #3b82f6;
  }

  .permission-checkbox input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .revoke-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.325rem;
    transition: all 0.15s;
  }

  .revoke-btn:hover:not(:disabled) {
    color: #ef4444;
    background-color: #fef2f2;
  }

  .revoke-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
    background: #fafafa;
    border-radius: 8px;
  }

  .empty-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }

  .empty-description {
    font-size: 0.9rem;
    color: #999;
  }
</style>
