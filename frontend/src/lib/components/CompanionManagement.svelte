<script lang="ts">
  import { useCompanionSearch } from '$lib/composables/useCompanionSearch';
  import { getCompanionDisplayName, getCompanionEmail, sortCompanions } from '$lib/utils/companionFormatter';
  import Alert from './Alert.svelte';

  /**
   * CompanionManagement
   * Refactored to use reusable composables and utilities
   * Eliminates 234 LOC of duplicated search/sort logic
   */

  // Props
  export let companions: any[] = [];
  export let canEdit: boolean = true;
  export let onAddCompanion: ((companion: any) => Promise<any>) | null = null;
  export let onRemoveCompanion: ((companionId: string) => Promise<void>) | null = null;
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;
  export let ownerId: string | null = null;
  export let isStandaloneItem: boolean = false;
  export let canRemoveCompanion: ((companion: any) => boolean) | null = null;

  // State
  let loading = false;
  let error: string | null = null;

  // Use composable for search functionality
  const {
    searchInput,
    searchResults,
    availableCompanions,
    showResults,
    loadingCompanions
  } = useCompanionSearch();

  /**
   * Filter search results to exclude already-added companions
   */
  $: filteredResults = $searchResults.filter((comp) => {
    const addedEmails = new Set(companions.map((c) => getCompanionEmail(c)));
    return !addedEmails.has(comp.email);
  });

  /**
   * Handle companion selection from search results
   */
  async function handleSelectCompanion(companion: any) {
    try {
      loading = true;
      error = null;

      let newCompanion;
      if (onAddCompanion) {
        newCompanion = await onAddCompanion(companion);
      } else {
        newCompanion = companion;
      }

      companions = [...companions, newCompanion];
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
      console.error('[CompanionManagement] Error removing companion:', err);
    } finally {
      loading = false;
    }
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

<div class="companion-management">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  <!-- Search Input -->
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
      {#each sortCompanions(companions, ownerId) as companion (companion.id)}
        <div class="companion-item">
          <div class="companion-info">
            <span class="companion-name">{getCompanionDisplayName(companion)}</span>
          </div>
          {#if canEdit && (!canRemoveCompanion || canRemoveCompanion(companion))}
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
    </div>
  {:else}
    <p class="no-companions">No companions added yet</p>
  {/if}
</div>

<style>
  .companion-management {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
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
    gap: 0.375rem;
  }

  .companion-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.425rem;
    background-color: #f9fafb;
    transition: all 0.15s;
  }

  .companion-item:hover {
    background-color: #f3f4f6;
  }

  .companion-info {
    flex: 1;
    min-width: 0;
  }

  .companion-name {
    display: block;
    font-size: 0.8rem;
    color: #111827;
    word-break: break-word;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
    margin-left: 0.5rem;
    transition: color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    color: #dc2626;
  }

  .remove-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .no-companions {
    font-size: 0.8rem;
    color: #6b7280;
    text-align: center;
    padding: 1rem 0;
    margin: 0;
  }
</style>
