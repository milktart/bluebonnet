<script lang="ts">
  import { onMount } from 'svelte';
  import { companionsApi } from '$lib/services/api';
  import Alert from './Alert.svelte';

  export let companions: any[] = [];
  export let canEdit: boolean = true;
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;
  export let onAddCompanion: ((companion: any) => Promise<any>) | null = null;
  export let onRemoveCompanion: ((companionId: string) => Promise<void>) | null = null;

  let searchInput = '';
  let loading = false;
  let error: string | null = null;
  let searchResults: any[] = [];
  let showResults = false;
  let availableCompanions: any[] = [];
  let loadingCompanions = true;


  // Load all companions on component mount
  async function loadCompanions() {
    try {
      loadingCompanions = true;
      const response = await companionsApi.getAll();
      // Response is already normalized to be an array
      availableCompanions = Array.isArray(response) ? response : (response?.data || []);
    } catch (err) {
      console.error('Failed to load companions:', err);
      availableCompanions = [];
    } finally {
      loadingCompanions = false;
    }
  }

  // Load companions when component mounts
  onMount(() => {
    loadCompanions();
  });

  function getCompanionDisplayName(comp: any): string {
    // Handle both direct companion objects and nested companion.companion objects
    const data = comp.companion || comp;

    if (data.firstName && data.lastName) {
      return `${data.firstName} ${data.lastName}`;
    } else if (data.firstName) {
      return data.firstName;
    } else if (data.lastName) {
      return data.lastName;
    }
    return data.email;
  }

  function getCompanionEmail(comp: any): string {
    // Handle both direct companion objects and nested companion.companion objects
    return (comp.companion?.email) || comp.email;
  }

  function searchCompanions() {
    if (!searchInput.trim()) {
      searchResults = [];
      showResults = false;
      return;
    }

    const query = searchInput.toLowerCase();

    // Filter available companions that aren't already added
    // Support both direct companions and companion objects with nested companion
    const addedEmails = new Set(companions.map(c => getCompanionEmail(c)));

    searchResults = availableCompanions.filter(comp => {
      const email = comp.email;
      if (addedEmails.has(email)) return false;
      const displayName = getCompanionDisplayName(comp);
      return email.toLowerCase().includes(query) ||
             displayName.toLowerCase().includes(query);
    });

    showResults = true;
  }

  async function handleSelectCompanion(companion: any) {
    try {
      loading = true;
      error = null;

      // Call the provided callback to add companion
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

      // Check if this is a duplicate companion error (409 conflict or already exists)
      if (errorMsg.includes('already exists') || errorMsg.includes('conflict')) {
        const displayName = getCompanionDisplayName(companion);
        error = `${displayName} is already added`;

        // Refresh search to ensure we're in sync
        searchCompanions();
      } else {
        error = errorMsg;
      }
    } finally {
      loading = false;
    }
  }

  async function handleRemoveCompanion(companionId: string) {
    try {
      loading = true;
      error = null;

      // Call the provided callback to remove companion
      if (onRemoveCompanion) {
        await onRemoveCompanion(companionId);
      }

      companions = companions.filter((c) => c.id !== companionId);

      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove companion';
      console.error('[ItemCompanionsForm] Error removing companion:', err);
    } finally {
      loading = false;
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      showResults = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="companions-form">
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
      <div class="list-header">
        <span>Name</span>
        <span class="action-col"></span>
      </div>
      {#each companions as companion (companion.id)}
        <div class="companion-item">
          <div class="companion-info">
            <span class="companion-name">{getCompanionDisplayName(companion)}</span>
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
      {/each}
    </div>
  {:else}
    <p class="no-companions">No companions added yet</p>
  {/if}
</div>

<style>
  .companions-form {
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

  /* Mobile: Use 16px font to prevent iOS auto-zoom on focus */
  @media (max-width: 639px) {
    .search-input {
      font-size: 16px;
    }
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
    color: #9ca3af;
    font-size: 0.8rem;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.8rem;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover {
    background-color: #f3f4f6;
  }

  .result-item:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .result-name {
    font-weight: 500;
    color: #111827;
    font-size: 0.8rem;
  }

  .result-email {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.2rem;
  }

  .companions-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-bottom: 1px solid #d1d5db;
  }

  .list-header {
    display: grid;
    grid-template-columns: 1fr auto;
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

  .action-col {
    width: 32px;
  }

  .companion-item {
    display: grid;
    grid-template-columns: 1fr auto;
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
