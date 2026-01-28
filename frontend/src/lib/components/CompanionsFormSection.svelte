<script lang="ts">
  import { useCompanionSearch } from '$lib/composables/useCompanionSearch';
  import { useCompanionPermissions } from '$lib/composables/useCompanionPermissions';
  import { getCompanionDisplayName, getCompanionEmail, sortCompanions } from '$lib/utils/companionFormatter';
  import { companionsApi } from '$lib/services/api';
  import Alert from './Alert.svelte';

  /**
   * CompanionsFormSection
   * Refactored with composables for search and permissions logic
   * Eliminates 313 LOC of duplicated code
   */

  // Core props
  export let type: 'trip' | 'item' = 'item';
  export let entityId: string = '';
  export let companions: any[] = [];
  export let canEdit: boolean = true;
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;

  // Trip-specific props
  export let tripOwnerId: string | null = null;

  // Item-specific props
  export let tripId: string | null = null;
  export let itemOwnerId: string | null = null;
  export let isStandaloneItem: boolean = false;
  export let currentUserId: string | null = null;
  export let onAddCompanion: ((companion: any) => Promise<any>) | null = null;
  export let onRemoveCompanion: ((companionId: string) => Promise<void>) | null = null;

  // State
  let loading = false;
  let error: string | null = null;

  // Use composables
  const { searchInput, searchResults, showResults } = useCompanionSearch();
  const permissionsHelper = useCompanionPermissions({
    tripOwnerId,
    itemOwnerId,
    currentUserId,
    isStandaloneItem
  });

  /**
   * Filter search results to exclude already-added companions
   */
  $: filteredResults = $searchResults.filter((comp) => {
    const addedEmails = new Set(companions.map((c) => getCompanionEmail(c)));
    return !addedEmails.has(comp.email);
  });

  /**
   * Determine owner ID for sorting
   */
  $: ownerId = tripOwnerId || itemOwnerId;

  /**
   * Handle companion selection from search results
   */
  async function handleSelectCompanion(companion: any) {
    try {
      loading = true;
      error = null;

      if (onAddCompanion) {
        await onAddCompanion(companion);
      }

      companions = [...companions, companion];
      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }

      searchInput.set('');
      showResults.set(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add companion';
      if (errorMsg.includes('already exists') || errorMsg.includes('conflict')) {
        error = `${getCompanionDisplayName(companion)} is already added`;
      } else {
        error = errorMsg;
      }
    } finally {
      loading = false;
    }
  }

  /**
   * Handle companion removal
   */
  async function handleRemoveCompanion(companionId: string) {
    try {
      loading = true;
      error = null;

      if (onRemoveCompanion) {
        await onRemoveCompanion(companionId);
      }

      companions = companions.filter((c) => c.id !== companionId && c.companionId !== companionId);
      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove companion';
      console.error('[CompanionsFormSection] Error removing companion:', err);
    } finally {
      loading = false;
    }
  }

  /**
   * Toggle edit permission (trip mode only)
   */
  async function togglePermission(companionId: string) {
    try {
      loading = true;
      error = null;

      const companion = companions.find((c) => c.companionId === companionId || c.id === companionId);
      if (!companion) return;

      const newCanEdit = !companion.canEdit;
      await companionsApi.updatePermissions(entityId, companionId, { canEdit: newCanEdit });

      companion.canEdit = newCanEdit;
      companions = companions;

      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update permission';
      console.error('[CompanionsFormSection] Error updating permission:', err);
      const companion = companions.find((c) => c.companionId === companionId || c.id === companionId);
      if (companion) {
        companion.canEdit = !companion.canEdit;
        companions = companions;
      }
    } finally {
      loading = false;
    }
  }

  /**
   * Check if companion can be removed (uses composable)
   */
  function canRemoveCompanion(companion: any): boolean {
    return permissionsHelper.canRemoveCompanion(companion, currentUserId);
  }

  /**
   * Check if companion is the owner (uses composable)
   */
  function isCompanionOwner(companion: any): boolean {
    return permissionsHelper.isCompanionOwner(companion);
  }

  /**
   * Click outside handler to close search results
   */
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      showResults.set(false);
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="companions-form-section">
  <h4 class="section-title">Travel Companions</h4>

  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  <!-- Search Input (only show if canEdit) -->
  {#if canEdit}
    <div class="search-container">
      <div class="search-box">
        <input
          type="text"
          placeholder="Search companions by name or email..."
          bind:value={$searchInput}
          on:focus={() => {
            if ($searchInput.trim()) showResults.set(true);
          }}
          disabled={loading}
          class="search-input"
        />
        {#if $searchInput}
          <button
            class="clear-btn"
            on:click={() => searchInput.set('')}
            disabled={loading}
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Search Results Dropdown -->
      {#if $showResults && filteredResults.length > 0}
        <div class="search-results">
          {#each filteredResults as result (result.id)}
            <button
              class="result-item"
              on:click={() => handleSelectCompanion(result)}
              disabled={loading}
            >
              <span class="result-name">{getCompanionDisplayName(result)}</span>
              <span class="result-email">{result.email}</span>
            </button>
          {/each}
        </div>
      {:else if $showResults && $searchInput.trim() && filteredResults.length === 0}
        <div class="search-results empty">
          <p>No companions found</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Companions List -->
  {#if companions && companions.length > 0}
    <div class="companions-list">
      <!-- Trip mode with permission column -->
      {#if type === 'trip'}
        <div class="list-header">
          <span>Name</span>
          <span class="permission-col">Role</span>
          <span class="action-col"></span>
        </div>
        {#each sortCompanions(companions, ownerId) as companion (companion.id)}
          {#if isCompanionOwner(companion)}
            <div class="companion-item owner-item">
              <div class="companion-info">
                <span class="companion-name">{getCompanionDisplayName(companion)}</span>
              </div>
              <div class="permission-cell">
                <span class="admin-badge">Admin</span>
              </div>
              <div class="action-col" style="visibility: hidden;" />
            </div>
          {:else}
            <div class="companion-item">
              <div class="companion-info">
                <span class="companion-name">{getCompanionDisplayName(companion)}</span>
              </div>
              <div class="permission-cell">
                <input
                  type="checkbox"
                  checked={companion.canEdit}
                  on:change={() => togglePermission(companion.companionId || companion.id)}
                  disabled={loading}
                  title={companion.canEdit ? 'Click to revoke edit access' : 'Click to grant edit access'}
                  class="permission-checkbox"
                />
              </div>
              <button
                class="remove-btn"
                on:click={() => handleRemoveCompanion(companion.companionId || companion.id)}
                disabled={loading}
                title="Remove companion"
              >
                ✕
              </button>
            </div>
          {/if}
        {/each}
      {/if}

      <!-- Item mode (simple list) -->
      {#if type === 'item'}
        {#each sortCompanions(companions, ownerId) as companion (companion.id)}
          <div class="companion-item">
            <div class="companion-info">
              <span class="companion-name">{getCompanionDisplayName(companion)}</span>
            </div>
            {#if canEdit && canRemoveCompanion(companion)}
              <button
                class="remove-btn"
                on:click={() => handleRemoveCompanion(companion.companionId || companion.id)}
                disabled={loading}
                title="Remove companion"
              >
                ✕
              </button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    <p class="no-companions">No companions added yet</p>
  {/if}
</div>

<style>
  .companions-form-section {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
  }

  .section-title {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .search-container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    font-size: 0.8rem;
    color: #111827;
    background-color: #ffffff;
    transition: all 0.15s;
    font-family: inherit;
    box-sizing: border-box;
    height: 2.5rem;
    display: flex;
    align-items: center;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-input::placeholder {
    color: #9ca3af;
  }

  .search-input:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    transition: color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
  }

  .clear-btn:hover {
    color: #6b7280;
  }

  .clear-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
  }

  .search-results.empty {
    padding: 0.75rem;
    text-align: center;
  }

  .search-results.empty p {
    margin: 0;
    color: #6b7280;
    font-size: 0.8rem;
  }

  .result-item {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: background-color 0.15s;
  }

  .result-item:hover {
    background-color: #f3f4f6;
  }

  .result-item:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .result-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: #111827;
  }

  .result-email {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .companions-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-bottom: 1px solid #d1d5db;
  }

  .list-header {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid #d1d5db;
    font-size: 0.7rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    align-items: center;
    box-sizing: border-box;
  }

  .permission-col {
    text-align: center;
    min-width: 60px;
  }

  .action-col {
    width: 32px;
  }

  .companion-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid #e5e7eb;
    align-items: center;
    background-color: transparent;
    transition: background-color 0.15s;
    box-sizing: border-box;
  }

  .companion-item:last-child {
    border-bottom: none;
  }

  .companion-item:hover {
    background-color: transparent;
  }

  .companion-item.owner-item {
    background-color: #f0f9ff;
  }

  .companion-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .companion-name {
    font-size: 0.75rem;
    color: #111827;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .permission-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 60px;
  }

  .permission-checkbox {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
    accent-color: #3b82f6;
  }

  .permission-checkbox:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .admin-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #ffffff;
    background-color: #3b82f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.3rem;
    text-align: center;
    min-width: 40px;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    transition: color 0.15s;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.425rem;
  }

  .remove-btn:hover:not(:disabled) {
    color: #ef4444;
    background-color: #fef2f2;
  }

  .remove-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .no-companions {
    margin: 0;
    color: #9ca3af;
    font-size: 0.8rem;
    text-align: center;
    padding: 1rem 0.75rem;
    background-color: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 0.425rem;
  }
</style>
