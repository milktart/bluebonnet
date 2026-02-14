<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  let loading = false;
  let error: string | null = null;

  let formData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  let passwordsMatch = true;

  function validateForm(): boolean {
    error = null;
    passwordsMatch = formData.newPassword === formData.confirmPassword;

    if (!formData.currentPassword.trim()) {
      error = 'Current password is required';
      return false;
    }

    if (!formData.newPassword.trim()) {
      error = 'New password is required';
      return false;
    }

    if (formData.newPassword.length < 6) {
      error = 'New password must be at least 6 characters';
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      error = 'Password confirmation is required';
      return false;
    }

    if (!passwordsMatch) {
      error = 'New passwords do not match';
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      loading = true;
      error = null;

      const response = await settingsApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (response && response.success) {
        resetForm();
      } else {
        error = response?.message || 'Failed to change password';
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while changing your password';
      error = errorMsg;
    } finally {
      loading = false;
    }
  }

  function resetForm() {
    formData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    passwordsMatch = true;
    error = null;
  }

  function handleCancel() {
    resetForm();
  }

  function handlePasswordChange() {
    if (formData.newPassword || formData.confirmPassword) {
      passwordsMatch = formData.newPassword === formData.confirmPassword;
    }
  }
</script>

<div class="edit-panel">
  <form on:submit|preventDefault={handleSubmit} class="edit-content">
    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <div class="form-fields">
      <div class="form-group">
        <label for="currentPassword">Current Password</label>
        <input
          type="password"
          id="currentPassword"
          value={formData.currentPassword}
          on:change={(e) => (formData.currentPassword = e.currentTarget.value)}
          placeholder="Enter your current password"
          disabled={loading}
          required
        />
      </div>

      <div class="password-info">
        <p class="info-text">
          <span class="material-symbols-outlined">info</span>
          Password must be at least 6 characters long
        </p>
      </div>

      <div class="form-group">
        <label for="newPassword">New Password</label>
        <input
          type="password"
          id="newPassword"
          value={formData.newPassword}
          on:change={(e) => (formData.newPassword = e.currentTarget.value)}
          on:input={handlePasswordChange}
          placeholder="Enter your new password"
          disabled={loading}
          required
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          on:change={(e) => (formData.confirmPassword = e.currentTarget.value)}
          on:input={handlePasswordChange}
          placeholder="Confirm your new password"
          disabled={loading}
          required
        />
        {#if !passwordsMatch && formData.confirmPassword}
          <span class="field-error">Passwords do not match</span>
        {/if}
      </div>
    </div>

    <div class="form-buttons">
      <button type="submit" disabled={loading || !passwordsMatch} class="submit-btn">
        {loading ? 'Saving...' : 'Change Password'}
      </button>
      <button type="button" on:click={handleCancel} disabled={loading} class="cancel-btn">
        Cancel
      </button>
    </div>
  </form>
</div>

<style>
  .password-info {
    background: #f5f5f5;
    border-radius: 0.375rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .info-text {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-text :global(.material-symbols-outlined) {
    font-size: 0.875rem;
    color: #3b82f6;
    flex-shrink: 0;
  }
</style>
