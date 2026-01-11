<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from './Alert.svelte';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  let companions: any[] = [];
  let trustedCompanions: any[] = [];
  let loading = true;
  let error: string | null = null;
  let successMessage: string | null = null;

  onMount(async () => {
    await loadCompanions();

    // Listen for companion update events (after form submission)
    window.addEventListener('companions-updated', handleCompanionsUpdated);

    return () => {
      window.removeEventListener('companions-updated', handleCompanionsUpdated);
    };
  });

  async function handleCompanionsUpdated() {
    await loadCompanions();
  }

  async function loadCompanions() {
    try {
      loading = true;
      error = null;

      // Fetch companions and trusted permissions separately for better error handling
      let companionsResp = { companions: [] };
      let trustedResp = { permissions: [] };

      try {
        companionsResp = await settingsApi.getAllCompanions();
      } catch (err) {
        console.error('[SettingsCompanions] Failed to fetch companions:', err);
        throw new Error(`Failed to fetch companions: ${err instanceof Error ? err.message : String(err)}`);
      }

      try {
        trustedResp = await settingsApi.getGrantedPermissions();
      } catch (err) {
        console.error('[SettingsCompanions] Failed to fetch granted permissions:', err);
        // Don't fail the whole operation if trusted permissions fail to load
        console.warn('[SettingsCompanions] Continuing without trusted companion data');
        trustedResp = { permissions: [] };
      }

      companions = companionsResp.companions || [];
      trustedCompanions = Array.isArray(trustedResp) ? trustedResp : trustedResp?.permissions || [];

      // Merge trusted companion info into companions list
      companions = companions.map(companion => {
        const trusted = trustedCompanions.find(t => t.trustedUserId === companion.id || t.trustedUser?.id === companion.id);
        return {
          ...companion,
          isTrusted: !!trusted,
          trustedPermission: trusted
        };
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load companions';
      console.error('[SettingsCompanions] Error in loadCompanions:', error);
    } finally {
      loading = false;
    }
  }

  async function handleRemoveCompanion(companionId: string) {
    try {
      loading = true;
      error = null;

      await settingsApi.removeCompanion(companionId);

      successMessage = 'Companion removed successfully';
      await loadCompanions();

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove companion';
    } finally {
      loading = false;
    }
  }

  async function handleRevokeAccess(companionId: string) {
    try {
      loading = true;
      error = null;

      await settingsApi.revokeCompanionAccess(companionId);

      successMessage = 'Companion access revoked successfully';
      await loadCompanions();

      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to revoke access';
    } finally {
      loading = false;
    }
  }

  function getDisplayName(companion: any): string {
    if (companion.firstName && companion.lastName) {
      return `${companion.firstName} ${companion.lastName.charAt(0)}.`;
    } else if (companion.firstName) {
      return companion.firstName;
    } else if (companion.lastName) {
      return companion.lastName;
    }
    return companion.email;
  }

  function dispatch(event: string, detail: any) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }

  function handleEditCompanion(companion: any) {
    // Dispatch event to parent to open edit form
    dispatch('edit-companion', { companion });
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
  {:else if companions && companions.length > 0}
    <div class="table-wrapper">
      <table class="companions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th class="center-col">Shares</th>
            <th class="center-col">Trusted</th>
            <th class="actions-col"></th>
          </tr>
        </thead>
        <tbody>
          {#each companions as companion (companion.id)}
            <tr>
              <td class="name-cell">{getDisplayName(companion)}</td>
              <td class="email-cell">{companion.email}</td>
              <td class="center-col">
                {#if companion.youInvited}
                  <span class="indicator">✓</span>
                {/if}
              </td>
              <td class="center-col">
                {#if companion.isTrusted}
                  <span class="indicator trusted">★</span>
                {/if}
              </td>
              <td class="actions-cell">
                <div class="actions-group">
                  {#if companion.youInvited}
                    <button
                      class="action-btn edit"
                      title="Edit companion"
                      on:click={() => handleEditCompanion(companion)}
                      disabled={loading}
                    >
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      class="action-btn delete"
                      title="Remove companion"
                      on:click={() => handleRemoveCompanion(companion.companionId)}
                      disabled={loading}
                    >
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  {/if}

                  {#if companion.theyInvited}
                    <button
                      class="action-btn revoke"
                      title="Revoke access"
                      on:click={() => handleRevokeAccess(companion.companionId)}
                      disabled={loading}
                    >
                      <span class="material-symbols-outlined">block</span>
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">
      <span class="material-symbols-outlined">groups</span>
      <p>No companions yet</p>
      <p class="empty-description">
        Start adding travel companions to share your trips and collaborate on travel planning.
      </p>
    </div>
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

  .table-wrapper {
    overflow-x: hidden;
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
  }

  .companions-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    font-size: 0.75rem;
    table-layout: fixed;
  }

  .companions-table thead {
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }

  .companions-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    vertical-align: middle;
  }

  .companions-table th.center-col {
    text-align: center;
  }

  .companions-table th.actions-col {
    text-align: center;
  }

  .companions-table td {
    padding: 0.875rem;
    border-bottom: 1px solid #f0f0f0;
    color: #1f2937;
    vertical-align: middle;
  }

  .companions-table tbody tr:hover {
    background-color: #fafafa;
  }

  .companions-table tbody tr:last-child td {
    border-bottom: none;
  }

  .name-cell {
    font-weight: 500;
    color: #1f2937;
  }

  .email-cell {
    color: #6b7280;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .center-col {
    text-align: center;
    width: 80px;
    vertical-align: middle;
  }

  .indicator {
    display: inline-flex;
    width: 24px;
    height: 24px;
    background-color: #d4edda;
    color: #155724;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .indicator.trusted {
    background-color: #fef08a;
    color: #854d0e;
    font-size: 0.85rem;
  }

  .actions-col {
    width: 100px;
    text-align: center;
  }

  .actions-cell {
    text-align: center;
    padding: 0.875rem 0.5rem;
  }

  .actions-group {
    display: flex;
    gap: 0.5rem;
    justify-content: end;
    align-items: center;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    line-height: 1;
    vertical-align: top;
  }

  .action-btn :global(.material-symbols-outlined) {
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn.edit {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .action-btn.edit:hover:not(:disabled) {
    background-color: #bbdefb;
  }

  .action-btn.delete {
    background-color: #ffebee;
    color: #c62828;
  }

  .action-btn.delete:hover:not(:disabled) {
    background-color: #ffcdd2;
  }

  .action-btn.revoke {
    background-color: #fce4ec;
    color: #ad1457;
  }

  .action-btn.revoke:hover:not(:disabled) {
    background-color: #f8bbd0;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
    background: #fafafa;
    border-radius: 8px;
  }

  .empty-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }

  .empty-description {
    font-size: 0.9rem;
    color: #999;
  }

  @media (max-width: 768px) {
    .companions-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .companions-table {
      font-size: 0.8rem;
    }

    .companions-table th,
    .companions-table td {
      padding: 0.625rem;
    }

    .name-cell {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .email-cell {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
