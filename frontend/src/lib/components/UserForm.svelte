<script lang="ts">
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { settingsApi } from '$lib/services/settings';

  interface User {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin?: boolean;
  }

  export let user: User | null = null;

  let formData = {
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    password: '',
    isAdmin: user?.isAdmin || false,
  };

  let submitting = false;
  let error: string | null = null;
  let success = false;

  const isEdit = !!user?.id;

  async function handleSubmit() {
    error = null;
    success = false;

    // Validation
    if (!formData.email) {
      error = 'Email is required';
      return;
    }

    if (!formData.firstName) {
      error = 'First name is required';
      return;
    }

    if (!formData.lastName) {
      error = 'Last name initial is required';
      return;
    }

    if (formData.lastName.length !== 1) {
      error = 'Last name must be a single character (initial)';
      return;
    }

    if (!isEdit && !formData.password) {
      error = 'Password is required for new users';
      return;
    }

    submitting = true;

    try {
      if (isEdit && user?.id) {
        // Update existing user
        await settingsApi.updateUser(user.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          isAdmin: formData.isAdmin,
        });
      } else {
        // Create new user
        await settingsApi.createUser({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          isAdmin: formData.isAdmin,
        });
      }

      success = true;
      window.dispatchEvent(new CustomEvent('users-updated'));
      dashboardStoreActions.closeTertiarySidebar();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save user';
      console.error('Error saving user:', err);
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    dashboardStoreActions.closeTertiarySidebar();
  }
</script>

<div class="p-4 space-y-4">
  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      {error}
    </div>
  {/if}

  {#if success}
    <div class="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
      {isEdit ? 'User updated successfully' : 'User created successfully'}
    </div>
  {/if}

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
    <input
      type="email"
      disabled={isEdit}
      bind:value={formData.email}
      class="w-full px-3 py-2 border border-gray-300 rounded text-sm {isEdit
        ? 'bg-gray-50 cursor-not-allowed'
        : ''}"
      placeholder="user@example.com"
    />
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
    <input
      type="text"
      bind:value={formData.firstName}
      class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
      placeholder="John"
    />
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name (Initial)</label>
    <input
      type="text"
      maxlength="1"
      bind:value={formData.lastName}
      class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
      placeholder="D"
    />
  </div>

  {#if !isEdit}
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
      <input
        type="password"
        bind:value={formData.password}
        class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        placeholder="Enter password"
      />
    </div>
  {/if}

  <div class="flex items-center">
    <input
      type="checkbox"
      id="isAdmin"
      bind:checked={formData.isAdmin}
      class="w-4 h-4 text-blue-600 border-gray-300 rounded"
    />
    <label for="isAdmin" class="ml-2 text-sm text-gray-700">Administrator</label>
  </div>

  <div class="flex gap-2 pt-4 border-t border-gray-200">
    <button
      on:click={handleSubmit}
      disabled={submitting}
      class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
    >
      {submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
    </button>
    <button
      on:click={handleCancel}
      disabled={submitting}
      class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
    >
      Cancel
    </button>
  </div>
</div>
