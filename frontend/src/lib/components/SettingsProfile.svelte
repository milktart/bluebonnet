<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import { authStoreActions } from '$lib/stores/authStore';
  import '$lib/styles/form-styles.css';

  export let data: any = null; // User data passed from parent

  let loading = false;
  let error: string | null = null;

  let formData = {
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    email: data?.email || ''
  };

  let originalEmail = data?.email || '';

  function validateForm(): boolean {
    error = null;

    if (!formData.firstName.trim()) {
      error = 'First name is required';
      return false;
    }

    if (!formData.lastName.trim()) {
      error = 'Last initial is required';
      return false;
    }

    if (formData.lastName.length > 1) {
      error = 'Last initial must be a single character';
      return false;
    }

    if (!formData.email.trim()) {
      error = 'Email is required';
      return false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      error = 'Please enter a valid email address';
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      loading = true;
      error = null;

      const response = await settingsApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });

      if (response && response.success) {
        // Update auth store with new user data
        if (response.data?.user) {
          authStoreActions.setUser(response.data.user);
          data = response.data.user;
          originalEmail = formData.email;
        }
      } else {
        error = response?.message || 'Failed to update profile';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred while updating your profile';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    // Reset form to original values
    formData = {
      firstName: data?.firstName || '',
      lastName: data?.lastName || '',
      email: data?.email || ''
    };
    error = null;
  }
</script>

<div class="edit-panel">
  <form on:submit|preventDefault={handleSubmit} class="edit-content">
    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <div class="form-fields">
      <div class="form-row cols-2">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            bind:value={formData.firstName}
            placeholder="John"
            required
          />
        </div>

        <div class="form-group">
          <label for="lastName">Last Initial</label>
          <input
            type="text"
            id="lastName"
            bind:value={formData.lastName}
            on:change={(e) => (formData.lastName = e.currentTarget.value.substring(0, 1))}
            placeholder="D"
            maxlength="1"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          type="email"
          id="email"
          bind:value={formData.email}
          placeholder="john@example.com"
          autocomplete="new-email"
          required
        />
      </div>
    </div>

    <div class="form-buttons">
      <button type="submit" disabled={loading} class="submit-btn">
        {loading ? 'Saving...' : 'Update Profile'}
      </button>
      <button type="button" on:click={handleCancel} disabled={loading} class="cancel-btn">
        Cancel
      </button>
    </div>
  </form>
</div>

