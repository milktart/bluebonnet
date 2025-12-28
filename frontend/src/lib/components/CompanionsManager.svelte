<script lang="ts">
  import { companionsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import TextInput from './TextInput.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import Card from './Card.svelte';
  import Grid from './Grid.svelte';

  export let tripId: string;
  export let companions: any[] = [];
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;

  let showAddForm = false;
  let loading = false;
  let error: string | null = null;
  let formData = {
    email: '',
    canEdit: false
  };

  async function handleAddCompanion() {
    try {
      if (!formData.email.trim()) {
        error = 'Email is required';
        return;
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        error = 'Please enter a valid email address';
        return;
      }

      loading = true;
      error = null;

      // Add companion to trip via API
      const newCompanion = await companionsApi.addToTrip(tripId, formData.email, formData.canEdit);

      companions = [...companions, newCompanion];

      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }

      // Reset form
      formData = { email: '', canEdit: false };
      showAddForm = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to add companion';
    } finally {
      loading = false;
    }
  }

  async function handleRemoveCompanion(companionId: string) {
    try {
      loading = true;
      error = null;

      await companionsApi.removeFromTrip(tripId, companionId);

      companions = companions.filter((c) => c.id !== companionId);

      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove companion';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    showAddForm = false;
    formData = { email: '', canEdit: false };
    error = null;
  }
</script>

<div class="companions-manager">
  <div class="manager-header">
    <h3>Travel Companions</h3>
    <Button
      variant="primary"
      on:click={() => (showAddForm = !showAddForm)}
      disabled={loading}
    >
      {showAddForm ? 'Cancel' : '+ Add Companion'}
    </Button>
  </div>

  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if showAddForm}
    <Card title="Invite Companion">
      <div class="add-form">
        <TextInput
          label="Companion Email"
          value={formData.email}
          on:change={(e) => (formData.email = e.target?.value || '')}
          required={true}
          type="email"
          placeholder="email@example.com"
          autocomplete="new-email"
        />

        <div class="permission-option">
          <label for="can-edit">
            <input
              id="can-edit"
              type="checkbox"
              bind:checked={formData.canEdit}
            />
            Allow editing of trip items
          </label>
          <p class="help-text">
            If unchecked, companion can only view the trip
          </p>
        </div>

        <div class="form-actions">
          <Button
            variant="primary"
            on:click={handleAddCompanion}
            disabled={loading}
          >
            {#if loading}
              <span class="loading-spinner"></span>
              Inviting...
            {:else}
              Invite Companion
            {/if}
          </Button>
          <Button variant="secondary" on:click={handleCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  {/if}

  {#if companions && companions.length > 0}
    <Grid columns={2} responsive={true} gap="1rem">
      {#each companions as companion (companion.id)}
        <Card title={companion.email} subtitle={companion.canEdit ? 'Can edit' : 'View only'}>
          <div class="companion-info">
            <p>
              <strong>Permissions:</strong>
              {#if companion.canEdit}
                <span class="permission-badge edit">Can edit and delete items</span>
              {:else}
                <span class="permission-badge view">View only</span>
              {/if}
            </p>
            {#if companion.addedAt}
              <p>
                <strong>Added:</strong>
                {new Date(companion.addedAt).toLocaleDateString()}
              </p>
            {/if}
          </div>
          <div slot="footer" class="companion-actions">
            <Button
              variant="danger"
              on:click={() => handleRemoveCompanion(companion.id)}
              disabled={loading}
            >
              Remove
            </Button>
          </div>
        </Card>
      {/each}
    </Grid>
  {:else if !showAddForm}
    <div class="empty-state">
      <p>No companions added yet</p>
    </div>
  {/if}
</div>

<style>
  .companions-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .manager-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .companion-info {
    margin: 0;
  }

  .companion-info p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
  }

  .companion-info strong {
    display: block;
    color: #333;
  }

  .companion-info a {
    color: #007bff;
    text-decoration: none;
  }

  .companion-info a:hover {
    text-decoration: underline;
  }

  .companion-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: #666;
  }

  .permission-option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .permission-option label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .permission-option input[type='checkbox'] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .help-text {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }

  .permission-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-left: 0.5rem;
  }

  .permission-badge.edit {
    background-color: #d4edda;
    color: #155724;
  }

  .permission-badge.view {
    background-color: #e2e3e5;
    color: #383d41;
  }

  .loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
