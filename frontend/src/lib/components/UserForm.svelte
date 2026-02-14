<script lang="ts">
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { settingsApi } from '$lib/services/settings';
  import { Button, FormGroup, FormRow, Input, Alert } from '$lib/components/ui';
  import '$lib/styles/form-styles.css';

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

  const isEdit = !!user?.id;

  async function handleSubmit() {
    error = null;

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
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          isAdmin: formData.isAdmin,
        };
        // Only include password if it was provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        await settingsApi.updateUser(user.id, updateData);
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
            bind:value={formData.firstName}
            placeholder="John"
            disabled={submitting}
          />
        </FormGroup>

        <FormGroup label="Last Initial" id="lastName">
          <Input
            id="lastName"
            type="text"
            bind:value={formData.lastName}
            placeholder="D"
            disabled={submitting}
          />
        </FormGroup>
      </FormRow>

      <FormGroup label="Email Address {isEdit ? '' : '*'}" id="email">
        <Input
          id="email"
          type="email"
          bind:value={formData.email}
          placeholder="user@example.com"
          required={!isEdit}
          disabled={submitting || isEdit}
        />
        {#if isEdit}
          <p class="help-text">Email cannot be changed</p>
        {/if}
      </FormGroup>

      <FormGroup label="Password {isEdit ? '' : '*'}" id="password">
        <Input
          id="password"
          type="password"
          bind:value={formData.password}
          placeholder={isEdit ? 'Leave blank to keep current password' : 'Enter password'}
          required={!isEdit}
          disabled={submitting}
        />
        {#if isEdit}
          <p class="help-text">Leave blank to keep the current password</p>
        {/if}
      </FormGroup>

      <div class="checkbox-wrapper">
        <label for="isAdmin" class="checkbox-label">
          <input
            id="isAdmin"
            type="checkbox"
            bind:checked={formData.isAdmin}
            disabled={submitting}
          />
          Administrator
        </label>
        <p class="checkbox-help-text">
          Administrators can manage users and platform settings
        </p>
      </div>
    </div>

    <div class="form-buttons">
      <Button type="submit" variant="primary" disabled={submitting} loading={submitting}>
        {isEdit ? 'Update User' : 'Create User'}
      </Button>
      <Button type="button" variant="secondary" on:click={handleCancel} disabled={submitting}>
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

  .checkbox-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .checkbox-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .checkbox-help-text {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
</style>
