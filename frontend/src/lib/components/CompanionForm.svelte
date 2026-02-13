<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  // Props for edit mode
  export let companion: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    userId?: string;
    canShareTrips?: boolean;
    canManageTrips?: boolean;
    theyShareTrips?: boolean;
    theyManageTrips?: boolean;
    hasLinkedUser?: boolean;
    linkedUserFirstName?: string;
    linkedUserLastName?: string;
  } | null = null;

  export let onSuccess: ((companion: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let nameFieldsLocked = false;

  let formData = {
    firstName: '',
    lastName: '',
    email: '',
    canShareTrips: true,
    theyManageTrips: false
  };

  // Initialize form data if in edit mode
  $: if (companion) {
    const hasLinkedUser = companion.hasLinkedUser || companion.userId;
    nameFieldsLocked = hasLinkedUser;

    formData = {
      firstName: hasLinkedUser && companion.linkedUserFirstName
        ? companion.linkedUserFirstName
        : (companion.firstName || ''),
      lastName: hasLinkedUser && companion.linkedUserLastName
        ? companion.linkedUserLastName
        : (companion.lastName || ''),
      email: companion.email || '',
      canShareTrips: companion.canShareTrips !== undefined ? companion.canShareTrips : true,
      theyManageTrips: companion.theyManageTrips !== undefined ? companion.theyManageTrips : false
    };
  }

  const isEditMode = !!companion?.id;

  async function checkEmailForExistingUser() {
    if (!isEditMode && formData.email.trim()) {
      try {
        // Call the API to check if a user account exists with this email
        const response = await settingsApi.checkEmailForUser(formData.email);
        if (response.hasUser && response.user) {
          // Found a user account with this email
          nameFieldsLocked = true;
          formData.firstName = response.user.firstName || '';
          formData.lastName = response.user.lastName || '';
        } else {
          // No user account found, unlock fields
          nameFieldsLocked = false;
        }
      } catch (err) {
        // If check fails, just unlock the fields and let user enter manually
        nameFieldsLocked = false;
      }
    }
  }

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
        email: formData.email,
        canShareTrips: formData.canShareTrips,
        theyManageTrips: formData.theyManageTrips
      };

      let response;
      let permissionsUpdated = false;

      if (isEditMode) {
        // In edit mode, we primarily update permissions
        // Only try to update companion details if they changed (for companions we created)
        const detailsChanged =
          (formData.firstName !== (companion?.firstName || '')) ||
          (formData.lastName !== (companion?.lastName || ''));

        if (detailsChanged && !companion?.theyShareTrips && !companion?.theyManageTrips) {
          // Only update details if we created this companion (no "they" permissions)
          try {
            response = await settingsApi.updateCompanion(companion!.id!, submitData);
          } catch (updateErr) {
            // If we can't update the companion (because we didn't create it),
            // that's okay - we'll just update permissions
            // Silently continue
          }
        }

        // Always update permissions if they changed
        const shareChanged = formData.canShareTrips !== (companion?.canShareTrips || false);
        const manageChanged = formData.theyManageTrips !== (companion?.theyManageTrips || false);

        if ((shareChanged || manageChanged) && companion?.id) {
          await settingsApi.updateCompanionPermissions(companion.id, {
            canShareTrips: formData.canShareTrips,
            theyManageTrips: formData.theyManageTrips
          });
          permissionsUpdated = true;
        } else {
        }
      } else {
        response = await settingsApi.createCompanion(submitData);
      }

      // Handle success callback
      if (isEditMode && permissionsUpdated && !response) {
        // This was a permission-only update, return updated companion
        if (onSuccess) {
          onSuccess({
            ...companion,
            canShareTrips: formData.canShareTrips,
            theyManageTrips: formData.theyManageTrips
          });
        }
      } else if (response) {
        // This was a companion create/update with response data
        const resultCompanion = response.data || response.companion || response;

        if (onSuccess) {
          onSuccess(resultCompanion);
        }
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
            disabled={loading || nameFieldsLocked}
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
            disabled={loading || nameFieldsLocked}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email Address *</label>
        <input
          id="email"
          type="email"
          bind:value={formData.email}
          on:blur={checkEmailForExistingUser}
          placeholder="companion@example.com"
          required
          disabled={loading || isEditMode}
        />
        {#if isEditMode}
          <p class="help-text">Email cannot be changed</p>
        {/if}
      </div>

      <div class="permissions-section">
        <h3>Permissions</h3>
        <div class="permission-group">
          <div class="checkbox-wrapper">
            <label for="share-trips" class="checkbox-label">
              <input
                id="share-trips"
                type="checkbox"
                bind:checked={formData.canShareTrips}
                disabled={loading}
              />
              Share my travel with this person
            </label>
            <p class="checkbox-help-text">
              They will see all my trips and the items I've added
            </p>
          </div>

          <div class="checkbox-wrapper">
            <label for="manage-trips" class="checkbox-label">
              <input
                id="manage-trips"
                type="checkbox"
                bind:checked={formData.theyManageTrips}
                disabled={loading}
              />
              Allow them to manage my travel
            </label>
            <p class="checkbox-help-text">
              They can create and edit trips on my account
            </p>
          </div>
        </div>

        {#if isEditMode && companion?.userId}
          <div class="received-permissions">
            <h4>Permissions they've granted me:</h4>
            <ul>
              {#if companion.theyShareTrips}
                <li>✓ They share their travel with me</li>
              {/if}
              {#if companion.theyManageTrips}
                <li>✓ I can manage their travel</li>
              {/if}
              {#if !companion.theyShareTrips && !companion.theyManageTrips}
                <li>None yet</li>
              {/if}
            </ul>
          </div>
        {/if}
      </div>
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
    color: var(--color-text-secondary);
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
    color: var(--color-text-primary);
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
    color: var(--color-text-secondary);
  }

  .info-box {
    padding: 0.75rem;
    background-color: var(--color-primary-bg);
    border-left: 3px solid var(--color-primary);
    border-radius: 0.375rem;
  }

  .info-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-info-text);
  }

  .permissions-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border-light);
    border-radius: 0.375rem;
  }

  .permissions-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .permission-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .received-permissions {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border-light);
  }

  .received-permissions h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-transform: uppercase;
  }

  .received-permissions ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .received-permissions li {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin: 0;
    padding: 0;
  }
</style>
