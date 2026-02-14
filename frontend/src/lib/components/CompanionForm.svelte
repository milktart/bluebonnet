<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import { Button, FormGroup, FormRow, Input, Alert } from '$lib/components/ui';
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

  // Form fields as regular let variables (bindable)
  let firstName = '';
  let lastName = '';
  let email = '';
  let canShareTrips = true;
  let theyManageTrips = false;

  // Reactive edit mode detection
  $: isEditMode = !!companion?.id;

  // Get display name for permissions text
  $: displayName = companion?.firstName || companion?.linkedUserFirstName || 'this person';

  // Update form fields when companion changes
  $: if (companion) {
    const hasLinkedUser = companion.hasLinkedUser || companion.userId;
    nameFieldsLocked = hasLinkedUser;

    firstName = hasLinkedUser && companion.linkedUserFirstName
      ? companion.linkedUserFirstName
      : (companion.firstName || '');

    lastName = hasLinkedUser && companion.linkedUserLastName
      ? companion.linkedUserLastName
      : (companion.lastName || '');

    email = companion.email || '';
    canShareTrips = companion.canShareTrips !== undefined ? companion.canShareTrips : true;
    theyManageTrips = companion.theyManageTrips !== undefined ? companion.theyManageTrips : false;
  } else {
    // Reset to defaults for new companion
    nameFieldsLocked = false;
    firstName = '';
    lastName = '';
    email = '';
    canShareTrips = true;
    theyManageTrips = false;
  }

  // Form data object for submission
  $: formData = {
    firstName,
    lastName,
    email,
    canShareTrips,
    theyManageTrips
  };

  async function checkEmailForExistingUser() {
    if (!isEditMode && email.trim()) {
      try {
        // Call the API to check if a user account exists with this email
        const response = await settingsApi.checkEmailForUser(email);
        if (response.hasUser && response.user) {
          // Found a user account with this email
          nameFieldsLocked = true;
          firstName = response.user.firstName || '';
          lastName = response.user.lastName || '';
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
    <Alert variant="error" dismissible={false}>{error}</Alert>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-fields">
      <FormRow columns={2} ratio="2fr 1fr">
        <FormGroup label="First Name" id="firstName">
          <Input
            id="firstName"
            type="text"
            bind:value={firstName}
            placeholder="John"
            disabled={loading || nameFieldsLocked}
          />
        </FormGroup>

        <FormGroup label="Last Initial" id="lastName">
          <Input
            id="lastName"
            type="text"
            bind:value={lastName}
            placeholder="D"
            disabled={loading || nameFieldsLocked}
          />
        </FormGroup>
      </FormRow>

      <FormGroup label="Email Address *" id="email">
        <Input
          id="email"
          type="email"
          bind:value={email}
          on:blur={checkEmailForExistingUser}
          placeholder="companion@example.com"
          required
          disabled={loading || isEditMode}
        />
        {#if isEditMode}
          <p class="help-text">Email cannot be changed</p>
        {/if}
      </FormGroup>

      <div class="permissions-section">
        <h3>Permissions</h3>

        <!-- Permissions I grant to them -->
        <div class="permission-subsection">
          <h4 class="subsection-title">Permissions I grant:</h4>
          <div class="permission-group">
            <label for="canShareTrips" class="permission-item">
              <input
                id="canShareTrips"
                type="checkbox"
                bind:checked={canShareTrips}
                disabled={loading}
              />
              <span class="permission-label">Share my travel with {displayName}</span>
            </label>

            <label for="theyManageTrips" class="permission-item">
              <input
                id="theyManageTrips"
                type="checkbox"
                bind:checked={theyManageTrips}
                disabled={loading}
              />
              <span class="permission-label">Allow {displayName} to manage my travel</span>
            </label>
          </div>
        </div>

        <!-- Permissions they grant to me -->
        {#if isEditMode}
          <div class="permission-subsection">
            <h4 class="subsection-title">Permissions {displayName} grants me:</h4>
            <div class="permission-group">
              <div class="permission-item">
                <span class="indicator-icon" class:active={companion?.theyShareTrips}>
                  {companion?.theyShareTrips ? '✓' : '○'}
                </span>
                <span class="permission-label">{displayName} shares their travel with me</span>
              </div>

              <div class="permission-item">
                <span class="indicator-icon" class:active={companion?.canManageTrips}>
                  {companion?.canManageTrips ? '✓' : '○'}
                </span>
                <span class="permission-label">I can manage {displayName}'s travel</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="form-buttons">
      <Button type="submit" variant="primary" disabled={loading} loading={loading} fullWidth>
        {isEditMode ? 'Update' : 'Add Companion'}
      </Button>
      <Button type="button" variant="secondary" on:click={handleCancel} disabled={loading} fullWidth>
        Cancel
      </Button>
    </div>
  </form>
</div>

<style>
  .help-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  /* Unified permission item styling */
  .permission-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.2rem;
  }

  .permission-item.permission-item {
    cursor: default;
  }

  label.permission-item {
    cursor: pointer;
  }

  .permission-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.2rem;
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
    margin-bottom: 0;
  }

  .permissions-section h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .permission-subsection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .permission-subsection:not(:last-child) {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-light);
  }

  .subsection-title {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .permission-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  /* Indicator icon styling */
  .indicator-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.2rem;
    height: 1.2rem;
    flex-shrink: 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text-tertiary);
    border-radius: 50%;
    background-color: var(--color-bg-tertiary);
  }

  .indicator-icon.active {
    color: var(--color-success-text);
    background-color: var(--color-success-bg);
  }

  /* Match ItemEditForm button spacing */
  .edit-content .form-buttons {
    margin-top: clamp(0.75rem, 2vw, 1rem);
  }
</style>
