<script lang="ts">
  import { onMount } from 'svelte';
  import { companionsApi } from '$lib/services/api';
  import Alert from './Alert.svelte';

  /**
   * Core reusable companion search and display logic
   * Used by both TripCompanionsForm and ItemCompanionsForm
   * Eliminates 200+ lines of duplicated code for search, sorting, display
   */

  // Props that both forms need
  export let companions: any[] = [];
  export let canEdit: boolean = true;
  export let onAddCompanion: ((companion: any) => Promise<any>) | null = null;
  export let onRemoveCompanion: ((companionId: string) => Promise<void>) | null = null;
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;

  // Props for sorting by owner
  export let ownerId: string | null = null;
  export let isStandaloneItem: boolean = false;

  // Optional callback to check if a specific companion can be removed
  // If not provided, all companions can be removed (when canEdit is true)
  export let canRemoveCompanion: ((companion: any) => boolean) | null = null;

  // State
  let searchInput = '';
  let loading = false;
  let error: string | null = null;
  let searchResults: any[] = [];
  let showResults = false;
  let availableCompanions: any[] = [];
  let loadingCompanions = true;

  /**
   * Load all available companions on mount
   */
  async function loadCompanions() {
    try {
      loadingCompanions = true;
      const response = await companionsApi.getAll();
      availableCompanions = Array.isArray(response) ? response : (response?.data || []);
    } catch (err) {
      console.error('Failed to load companions:', err);
      availableCompanions = [];
    } finally {
      loadingCompanions = false;
    }
  }

  onMount(() => {
    loadCompanions();
  });

  /**
   * Get display name from companion object
   * Handles both direct companion objects and nested companion.companion structures
   */
  function getCompanionDisplayName(comp: any, isCurrentUser: boolean = false): string {
    const data = comp.companion || comp;

    let name = '';
    if (data.firstName && data.lastName) {
      name = `${data.firstName} ${data.lastName}`;
    } else if (data.firstName) {
      name = data.firstName;
    } else if (data.lastName) {
      name = data.lastName;
    } else if (data.name) {
      name = data.name;
    } else {
      name = data.email;
    }

    if (isCurrentUser) {
      return `${name} (me)`;
    }
    return name;
  }

  /**
   * Extract email from companion object
   */
  function getCompanionEmail(comp: any): string {
    return (comp.companion?.email) || comp.email;
  }

  /**
   * Sort companions with owner first, then alphabetically by first name
   * This is the SINGLE SOURCE OF TRUTH for companion sorting
   */
  function getSortedCompanions(comps: any[]): any[] {
    return [...comps].sort((a, b) => {
      const aData = a.companion || a;
      const bData = b.companion || b;
      const aUserId = aData.userId || a.userId;
      const bUserId = bData.userId || b.userId;

      // Owner comes first (if specified)
      if (ownerId) {
        if (aUserId === ownerId && bUserId !== ownerId) return -1;
        if (aUserId !== ownerId && bUserId === ownerId) return 1;
      }

      // Then sort alphabetically by first name, then last initial
      const aFirstName = (aData.firstName || '').toLowerCase();
      const bFirstName = (bData.firstName || '').toLowerCase();
      const aLastName = (aData.lastName || '').toLowerCase();
      const bLastName = (bData.lastName || '').toLowerCase();

      const aLastInitial = aLastName.charAt(0).toUpperCase();
      const bLastInitial = bLastName.charAt(0).toUpperCase();

      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName);
      }

      return aLastInitial.localeCompare(bLastInitial);
    });
  }

  /**
   * Search companions - filter by name/email and exclude already-added
   */
  function searchCompanions() {
    if (!searchInput.trim()) {
      searchResults = [];
      showResults = false;
      return;
    }

    const query = searchInput.toLowerCase();
    const addedEmails = new Set(companions.map((c) => getCompanionEmail(c)));

    searchResults = availableCompanions.filter((comp) => {
      const email = comp.email;
      if (addedEmails.has(email)) return false;
      const displayName = getCompanionDisplayName(comp);
      return email.toLowerCase().includes(query) || displayName.toLowerCase().includes(query);
    });

    showResults = true;
  }

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

      searchInput = '';
      searchResults = [];
      showResults = false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add companion';

      if (errorMsg.includes('already exists') || errorMsg.includes('conflict')) {
        const displayName = getCompanionDisplayName(companion);
        error = `${displayName} is already added`;
        searchCompanions();
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

      companions = companions.filter((c) => {
        const matches = c.id === companionId || c.companionId === companionId;
        return !matches;
      });

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
      showResults = false;
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
          bind:value={searchInput}
          on:input={searchCompanions}
          on:focus={() => {
            if (searchInput.trim()) showResults = true;
          }}
          disabled={loading}
          class="search-input"
        />
        {#if searchInput}
          <button
            class="clear-btn"
            on:click={() => {
              searchInput = '';
              searchResults = [];
              showResults = false;
            }}
            disabled={loading}
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Search Results Dropdown -->
      {#if showResults && searchResults.length > 0}
        <div class="search-results">
          {#each searchResults as result (result.id)}
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
      {:else if showResults && searchInput.trim() && searchResults.length === 0}
        <div class="search-results empty">
          <p>No companions found</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Companions List -->
  {#if companions && companions.length > 0}
    <div class="companions-list">
      {#each getSortedCompanions(companions) as companion (companion.id)}
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
