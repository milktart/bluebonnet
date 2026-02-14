<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from './Alert.svelte';
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { settingsApi } from '$lib/services/settings';

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    lastLogin: string | null;
    createdAt: string;
  }

  let users: User[] = [];
  let loading = false;
  let error: string | null = null;
  let successMessage: string | null = null;

  onMount(() => {
    loadUsers();

    // Listen for updates
    window.addEventListener('users-updated', handleUsersUpdated);
    return () => {
      window.removeEventListener('users-updated', handleUsersUpdated);
    };
  });

  async function loadUsers() {
    loading = true;
    error = null;
    try {
      const response = await settingsApi.getAllUsers();
      users = response.users || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load users';
      console.error('Error loading users:', err);
    } finally {
      loading = false;
    }
  }

  function handleUsersUpdated() {
    loadUsers();
  }

  function getDisplayName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  function formatLastLogin(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleEditUser(user: User) {
    const event = new CustomEvent('edit-user', { detail: { user } });
    window.dispatchEvent(event);
    dashboardStoreActions.openTertiarySidebar({
      type: 'edit-user',
      data: { user },
    });
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Are you sure you want to deactivate ${getDisplayName(user)}'s account?`)) {
      return;
    }

    try {
      await settingsApi.deactivateUser(user.id);
      successMessage = 'User deactivated successfully';
      // Dispatch event to refresh table
      window.dispatchEvent(new CustomEvent('users-updated'));

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to deactivate user';
      console.error('Error deactivating user:', err);
    }
  }
</script>

<div class="settings-users-container">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if successMessage}
    <Alert type="success" message={successMessage} dismissible />
  {/if}

  {#if loading}
    <div class="loading-state">
      <span class="material-symbols-outlined">hourglass_empty</span>
      <p>Loading users...</p>
    </div>
  {:else if users && users.length > 0}
    <div class="table-wrapper">
      <table class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th class="center-col">Admin</th>
            <th>Last Login</th>
            <th class="actions-col"></th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr>
              <td class="name-cell">{getDisplayName(user)}</td>
              <td class="email-cell">{user.email}</td>
              <td class="center-col">
                {#if user.isAdmin}
                  <span class="indicator">✓</span>
                {/if}
              </td>
              <td class="login-cell">{formatLastLogin(user.lastLogin)}</td>
              <td class="actions-cell">
                <div class="actions-group">
                  <button
                    class="action-btn edit-btn"
                    title="Edit user"
                    on:click={() => handleEditUser(user)}
                    disabled={loading}
                  >
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    title="Deactivate user"
                    on:click={() => handleDeleteUser(user)}
                    disabled={loading}
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">
      <span class="material-symbols-outlined">admin_panel_settings</span>
      <p>No users found</p>
      <p class="empty-description">
        Start adding users to manage platform access and permissions.
      </p>
    </div>
  {/if}
</div>

<style>
  .settings-users-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
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

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    font-size: 0.75rem;
  }

  .users-table thead {
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }

  .users-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    vertical-align: middle;
  }

  .users-table th.center-col {
    text-align: center;
  }

  .users-table th.actions-col {
    text-align: center;
  }

  .users-table td {
    padding: 0.875rem;
    border-bottom: 1px solid var(--color-border-light);
    color: #1f2937;
    vertical-align: middle;
  }

  .users-table tbody tr:hover {
    background-color: #fafafa;
  }

  .users-table tbody tr:last-child td {
    border-bottom: none;
  }

  .name-cell {
    font-weight: 500;
    color: #1f2937;
  }

  .email-cell {
    color: #6b7280;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .login-cell {
    color: #6b7280;
    white-space: nowrap;
  }

  .center-col {
    text-align: center;
    width: 120px;
    vertical-align: middle;
  }

  .indicator {
    display: inline-flex;
    width: 24px;
    height: 24px;
    background-color: #d4edda;
    color: #155724;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .actions-col {
    width: 200px;
    text-align: center;
  }

  .actions-cell {
    text-align: center;
    padding: 0.875rem 0.5rem;
  }

  .actions-group {
    display: flex;
    gap: 0.5rem;
    justify-content: end;
    align-items: center;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    line-height: 1;
    vertical-align: top;
  }

  .action-btn :global(.material-symbols-outlined) {
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .edit-btn:hover:not(:disabled) {
    background-color: #bbdefb;
  }

  .delete-btn {
    background-color: #ffebee;
    color: #c62828;
  }

  .delete-btn:hover:not(:disabled) {
    background-color: #ffcdd2;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .empty-description {
    font-size: 0.85rem;
    color: #999;
  }
</style>
