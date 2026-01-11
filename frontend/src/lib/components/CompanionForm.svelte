<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  // Props for edit mode
  export let companion: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    isTrusted?: boolean;
    trustedPermission?: any;
  } | null = null;

  export let onSuccess: ((companion: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;

  let formData = {
    firstName: '',
    lastName: '',
    email: '',
    isTrusted: false
  };

  // Initialize form data if in edit mode
  $: if (companion) {
    formData = {
      firstName: companion.firstName || '',
      lastName: companion.lastName || '',
      email: companion.email || '',
      isTrusted: companion.isTrusted || false
    };
  }

  const isEditMode = !!companion?.id;

  async function handleSubmit() {
    try {
      // Validation
      error = null;

      if (!formData.email.trim()) {
        error = 'Email is required';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        error = 'Please enter a valid email address';
        return;
      }

      // In edit mode, both firstName and lastName should be provided together, or neither
      if (isEditMode && (formData.firstName || formData.lastName)) {
        if (!formData.firstName || !formData.lastName) {
          error = 'Please provide both first name and last name, or neither';
          return;
        }
      }

      loading = true;

      const submitData = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email
      };

      let response;
      if (isEditMode) {
        response = await settingsApi.updateCompanion(companion!.id!, submitData);

        // Handle trusted companion status changes
        const wasChanged = formData.isTrusted !== (companion?.isTrusted || false);
        if (wasChanged && companion?.userId) {
          try {
            if (formData.isTrusted) {
              // Grant trusted access (use userId, not companion id)
              await settingsApi.grantPermission({
                trustedUserId: companion.userId,
                canManageAllTrips: true,
                canViewAllTrips: true
              });
            } else if (companion?.trustedPermission) {
              // Revoke trusted access
              await settingsApi.revokePermission(companion.userId);
            }
          } catch (permErr) {
            console.warn('Failed to update trusted status:', permErr);
            // Don't fail the whole operation if permission update fails
          }
        }
      } else {
        response = await settingsApi.createCompanion(submitData);
      }

      const resultCompanion = response.data || response.companion || response;

      if (onSuccess) {
        onSuccess(resultCompanion);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : (isEditMode ? 'Failed to update companion' : 'Failed to add companion');
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
      <div class="form-row cols-2-1">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            bind:value={formData.firstName}
            placeholder="John"
            disabled={loading}
          />
        </div>

        <div class="form-group">
          <label for="lastName">Last Initial</label>
          <input
            id="lastName"
            type="text"
            bind:value={formData.lastName}
            placeholder="D"
            maxlength="1"
            disabled={loading}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email Address *</label>
        <input
          id="email"
          type="email"
          bind:value={formData.email}
          placeholder="companion@example.com"
          required
          disabled={loading || isEditMode}
        />
        {#if isEditMode}
          <p class="help-text">Email cannot be changed</p>
        {/if}
      </div>

      {#if isEditMode}
        {#if companion?.userId}
          <div class="checkbox-wrapper">
            <label for="is-trusted" class="checkbox-label">
              <input
                id="is-trusted"
                type="checkbox"
                bind:checked={formData.isTrusted}
                disabled={loading}
              />
              Grant trusted companion access
            </label>
            <p class="checkbox-help-text">
              Trusted companions can manage ALL your trips, not just ones they're invited to
            </p>
          </div>
        {:else}
          <div class="info-box">
            <p class="info-text">
              This companion hasn't created an account yet. Once they sign up using their email address, you'll be able to grant them admin access.
            </p>
          </div>
        {/if}
      {/if}
    </div>

    <div class="form-buttons">
      <button class="submit-btn" type="submit" disabled={loading}>
        {isEditMode ? 'Update' : 'Add Companion'}
      </button>
      <button class="cancel-btn" type="button" on:click={handleCancel} disabled={loading}>
        Cancel
      </button>
    </div>
  </form>
</div>

<style>
  .help-text {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
  }

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

  .checkbox-label input[type='checkbox']:disabled {
    cursor: not-allowed;
  }

  .checkbox-help-text {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .info-box {
    padding: 0.75rem;
    background-color: #eff6ff;
    border-left: 3px solid #3b82f6;
    border-radius: 0.375rem;
  }

  .info-text {
    margin: 0;
    font-size: 0.8rem;
    color: #1e40af;
  }
</style>
