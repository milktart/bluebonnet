<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  export let onSuccess: ((companion: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    email: '',
    canEdit: false
  };

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.email.trim()) {
        error = 'Email is required';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        error = 'Please enter a valid email address';
        return;
      }

      loading = true;
      error = null;

      const response = await settingsApi.createCompanion({
        email: formData.email,
        canEdit: formData.canEdit
      });

      const newCompanion = response.data || response;

      if (onSuccess) {
        onSuccess(newCompanion);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to add companion';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }
</script>

<div class="edit-content">
  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-fields">
      <div class="form-group">
        <label>Email Address *</label>
        <input
          type="email"
          bind:value={formData.email}
          placeholder="companion@example.com"
          required
        />
      </div>

      <div class="checkbox-wrapper">
        <label for="can-edit" class="checkbox-label">
          <input
            id="can-edit"
            type="checkbox"
            bind:checked={formData.canEdit}
            disabled={loading}
          />
          Allow editing of trip items
        </label>
        <p class="checkbox-help-text">
          If unchecked, companion can only view your trips
        </p>
      </div>
    </div>

    <div class="form-buttons">
      <button class="submit-btn" type="submit" disabled={loading}>
        Add Companion
      </button>
      <button class="cancel-btn" type="button" on:click={handleCancel} disabled={loading}>
        Cancel
      </button>
    </div>
  </form>
</div>

<style>
  .checkbox-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0;
  }

  .checkbox-label input[type='checkbox'] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .checkbox-help-text {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
  }
</style>
