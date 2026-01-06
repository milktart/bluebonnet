<script lang="ts">
  import { onMount } from 'svelte';
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
      // Dispatch event to refresh table
      window.dispatchEvent(new CustomEvent('users-updated'));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to deactivate user';
      console.error('Error deactivating user:', err);
    }
  }
</script>

<div class="w-full h-full flex flex-col">
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <p class="text-gray-500">Loading users...</p>
    </div>
  {:else if error}
    <div class="p-4 bg-red-50 border border-red-200 rounded text-red-700">
      {error}
    </div>
  {:else if users.length === 0}
    <div class="flex items-center justify-center h-full">
      <p class="text-gray-500">No users found</p>
    </div>
  {:else}
    <div class="overflow-x-auto flex-1">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="px-3 py-2 font-semibold text-gray-700 uppercase tracking-wider">Name</th>
            <th class="px-3 py-2 font-semibold text-gray-700 uppercase tracking-wider">Email</th>
            <th class="px-3 py-2 font-semibold text-gray-700 uppercase tracking-wider text-center">Admin</th>
            <th class="px-3 py-2 font-semibold text-gray-700 uppercase tracking-wider">Last Login</th>
            <th class="px-3 py-2 font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class="border-b border-gray-200 hover:bg-gray-50">
              <td class="px-3 py-2 text-gray-900">{getDisplayName(user)}</td>
              <td class="px-3 py-2 text-gray-700">{user.email}</td>
              <td class="px-3 py-2 text-center">
                {#if user.isAdmin}
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                    <span class="text-green-700 material-symbols-outlined text-sm">check</span>
                  </span>
                {/if}
              </td>
              <td class="px-3 py-2 text-gray-700 whitespace-nowrap">{formatLastLogin(user.lastLogin)}</td>
              <td class="px-3 py-2 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    class="w-8 h-8 flex items-center justify-center rounded hover:bg-blue-100 text-blue-600"
                    title="Edit user"
                    on:click={() => handleEditUser(user)}
                  >
                    <span class="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    class="w-8 h-8 flex items-center justify-center rounded hover:bg-red-100 text-red-600"
                    title="Deactivate user"
                    on:click={() => handleDeleteUser(user)}
                  >
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  :global(.material-symbols-outlined) {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
</style>
