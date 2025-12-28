<script lang="ts">
  import { onMount } from 'svelte';
  import TextInput from './TextInput.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import Card from './Card.svelte';
  import Grid from './Grid.svelte';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  export let onAddCompanion: (() => void) | null = null;

  let companions: any[] = [];
  let companionProfiles: any[] = [];
  let loading = true;
  let error: string | null = null;
  let successMessage: string | null = null;

  let showAddForm = false;
  let formLoading = false;
  let formData = {
    email: '',
    canEdit: false
  };

  onMount(async () => {
    await loadCompanions();
  });

  async function loadCompanions() {
    try {
      loading = true;
      error = null;
      const response = await settingsApi.getCompanions();

      // Handle response structure: { success: true, companions: [...] }
      const companionsData = response.companions || response.data || [];
      companions = Array.isArray(companionsData) ? companionsData : [];

      // Companion profiles (people who added you) would be in: response.profiles or response.companionProfiles
      companionProfiles = response.profiles || response.companionProfiles || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load companions';
    } finally {
      loading = false;
    }
  }

  async function handleAddCompanion() {
    try {
      if (!formData.email.trim()) {
        error = 'Email is required';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        error = 'Please enter a valid email address';
        return;
      }

      formLoading = true;
      error = null;

      const response = await settingsApi.createCompanion({
        email: formData.email,
        canEdit: formData.canEdit
      });

      const newCompanion = response.data || response;
      companions = [...companions, newCompanion];
      successMessage = 'Companion added successfully';

      // Reset form
      formData = { email: '', canEdit: false };
      showAddForm = false;

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to add companion';
    } finally {
      formLoading = false;
    }
  }

  async function handleRemoveCompanion(companionId: string) {
    if (!confirm('Are you sure you want to remove this companion?')) {
      return;
    }

    try {
      formLoading = true;
      error = null;

      await settingsApi.removeCompanion(companionId);

      companions = companions.filter((c) => c.id !== companionId);
      successMessage = 'Companion removed successfully';

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove companion';
    } finally {
      formLoading = false;
    }
  }

  async function handleRevokeProfile(profileId: string) {
    if (!confirm('Are you sure you want to revoke this companion\'s access to your trips?')) {
      return;
    }

    try {
      formLoading = true;
      error = null;

      await settingsApi.revokeCompanionAccess(profileId);

      companionProfiles = companionProfiles.filter((p) => p.id !== profileId);
      successMessage = 'Companion access revoked successfully';

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to revoke companion access';
    } finally {
      formLoading = false;
    }
  }

  function handleCancel() {
    showAddForm = false;
    formData = { email: '', canEdit: false };
    error = null;
  }

</script>

<div class="settings-companions-container">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if successMessage}
    <Alert type="success" message={successMessage} dismissible />
  {/if}

  {#if loading}
    <div class="loading-state">
      <span class="material-symbols-outlined">hourglass_empty</span>
      <p>Loading companions...</p>
    </div>
  {:else}
    <!-- Companions You've Created Section -->
    <div class="companions-section">
      <div class="section-header">
        <h3>Companions You've Added</h3>
        <Button
          variant="primary"
          on:click={() => {
            if (onAddCompanion) {
              onAddCompanion();
            } else {
              showAddForm = !showAddForm;
            }
          }}
          disabled={formLoading}
          size="small"
        >
          + Add Companion
        </Button>
      </div>

      {#if showAddForm}
        <Card title="Invite Travel Companion">
          <div class="add-form">
            <TextInput
              label="Companion Email"
              bind:value={formData.email}
              required={true}
              type="email"
              placeholder="email@example.com"
              autocomplete="new-email"
              disabled={formLoading}
            />

            <div class="permission-option">
              <label for="can-edit">
                <input
                  id="can-edit"
                  type="checkbox"
                  bind:checked={formData.canEdit}
                  disabled={formLoading}
                />
                Allow editing of trip items
              </label>
              <p class="help-text">
                If unchecked, companion can only view your trips
              </p>
            </div>

            <div class="form-actions">
              <Button
                variant="primary"
                on:click={handleAddCompanion}
                disabled={formLoading}
                loading={formLoading}
              >
                Add Companion
              </Button>
              <Button
                variant="secondary"
                on:click={handleCancel}
                disabled={formLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      {/if}

      {#if companions && companions.length > 0}
        <Grid columns={2} responsive={true} gap="1rem">
          {#each companions as companion (companion.id)}
            <Card
              title={companion.email}
              subtitle={companion.canEdit ? 'Can edit trips' : 'View only'}
            >
              <div class="companion-info">
                {#if companion.canEdit}
                  <span class="permission-badge edit">Can edit and delete items</span>
                {:else}
                  <span class="permission-badge view">View only</span>
                {/if}

                {#if companion.addedAt}
                  <p class="added-date">
                    Added: {new Date(companion.addedAt).toLocaleDateString()}
                  </p>
                {/if}
              </div>
              <div slot="footer" class="companion-actions">
                <Button
                  variant="danger"
                  on:click={() => handleRemoveCompanion(companion.id)}
                  disabled={formLoading}
                >
                  Remove
                </Button>
              </div>
            </Card>
          {/each}
        </Grid>
      {:else if !showAddForm}
        <div class="empty-state">
          <span class="material-symbols-outlined">groups</span>
          <p>No companions added yet</p>
        </div>
      {/if}
    </div>

    <!-- Your Companion Profile Section -->
    {#if companionProfiles && companionProfiles.length > 0}
      <div class="companions-section profile-section">
        <h3>Your Companion Profiles</h3>
        <p class="section-description">
          People who have added you as a travel companion. They can see trips they've included you in.
        </p>

        <Grid columns={2} responsive={true} gap="1rem">
          {#each companionProfiles as profile (profile.id)}
            <Card
              title={profile.name || 'Companion'}
              subtitle={`Added by ${profile.creator?.firstName || ''} ${profile.creator?.lastName || ''}`}
            >
              <div class="profile-info">
                {#if profile.creator?.email}
                  <p class="creator-email">
                    <span class="material-symbols-outlined">email</span>
                    {profile.creator.email}
                  </p>
                {/if}

                {#if profile.createdAt}
                  <p class="added-date">
                    Added: {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                {/if}
              </div>
              <div slot="footer" class="profile-actions">
                <Button
                  variant="danger"
                  on:click={() => handleRevokeProfile(profile.id)}
                  disabled={formLoading}
                >
                  Revoke Access
                </Button>
              </div>
            </Card>
          {/each}
        </Grid>
      </div>
    {:else}
      <div class="no-profiles">
        <span class="material-symbols-outlined">person_outline</span>
        <p>No one has added you as a travel companion yet</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .settings-companions-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
  }

  .loading-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .companions-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .companions-section.profile-section {
    padding-top: 2rem;
    border-top: 1px solid #e0e0e0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .section-header h3,
  .companions-section h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1f2937;
  }

  .section-description {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    line-height: 1.5;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-start;
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
    font-weight: 500;
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

  .companion-info,
  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .permission-badge {
    display: inline-block;
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    width: fit-content;
  }

  .permission-badge.edit {
    background-color: #d4edda;
    color: #155724;
  }

  .permission-badge.view {
    background-color: #e2e3e5;
    color: #383d41;
  }

  .added-date {
    margin: 0;
    font-size: 0.85rem;
    color: #999;
  }

  .creator-email {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .creator-email :global(.material-symbols-outlined) {
    font-size: 16px;
  }

  .companion-actions,
  .profile-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .empty-state,
  .no-profiles {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem 1rem;
    text-align: center;
    color: #999;
    background: #fafafa;
    border-radius: 8px;
  }

  .empty-state :global(.material-symbols-outlined),
  .no-profiles :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-state p,
  .no-profiles p {
    margin: 0;
    font-size: 1rem;
  }

  @media (max-width: 640px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .form-actions {
      flex-direction: column;
      width: 100%;
    }

    :global(.form-actions button) {
      width: 100%;
    }
  }
</style>
