<script lang="ts">
  import { onMount } from 'svelte';
  import { companionsApi } from '$lib/services/api';
  import Alert from './Alert.svelte';

  export let tripId: string;
  export let companions: any[] = [];
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;

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
    if (comp.firstName && comp.lastName) {
      return `${comp.firstName} ${comp.lastName}`;
    } else if (comp.firstName) {
      return comp.firstName;
    } else if (comp.lastName) {
      return comp.lastName;
    }
    return comp.email;
  }

  function searchCompanions() {
    if (!searchInput.trim()) {
      searchResults = [];
      showResults = false;
      return;
    }

    const query = searchInput.toLowerCase();

    // Filter available companions that aren't already added
    const addedEmails = new Set(companions.map(c => c.email));

    searchResults = availableCompanions.filter(comp => {
      if (addedEmails.has(comp.email)) return false;
      const displayName = getCompanionDisplayName(comp);
      return comp.email.toLowerCase().includes(query) ||
             displayName.toLowerCase().includes(query);
    });

    showResults = true;
  }

  async function handleSelectCompanion(companion: any) {
    try {
      loading = true;
      error = null;

      // Add companion to trip using companionId (without edit permission by default)
      const newCompanion = await companionsApi.addToTrip(tripId, companion.id, false);

      companions = [...companions, newCompanion];

      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }

      searchInput = '';
      searchResults = [];
      showResults = false;
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

  function togglePermission(companionId: string) {
    // TODO: Implement permission toggle with API
    const companion = companions.find(c => c.id === companionId);
    if (companion) {
      companion.canEdit = !companion.canEdit;
      companions = companions;
      if (onCompanionsUpdate) {
        onCompanionsUpdate(companions);
      }
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

<div class="trip-companions-form">
  <h4 class="section-title">Travel Companions</h4>

  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  <!-- Search Input -->
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

  <!-- Companions List -->
  {#if companions && companions.length > 0}
    <div class="companions-list">
      <div class="list-header">
        <span>Name</span>
        <span class="permission-col">Permission</span>
        <span class="action-col"></span>
      </div>
      {#each companions as companion (companion.id)}
        <div class="companion-item">
          <div class="companion-info">
            <span class="companion-email">{companion.email}</span>
          </div>
          <button
            class="permission-toggle"
            on:click={() => togglePermission(companion.id)}
            disabled={loading}
            title={companion.canEdit ? 'Click to make view-only' : 'Click to allow editing'}
          >
            {companion.canEdit ? 'Can edit' : 'View only'}
          </button>
          <button
            class="remove-btn"
            on:click={() => handleRemoveCompanion(companion.id)}
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
  .trip-companions-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #111827;
  }

  .search-container {
    position: relative;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #111827;
    background-color: #ffffff;
    transition: border-color 0.2s, box-shadow 0.2s;
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
    color: #9ca3af;
    cursor: not-allowed;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0;
    transition: color 0.2s;
  }

  .clear-btn:hover {
    color: #6b7280;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
  }

  .search-results.empty {
    padding: 1rem;
    text-align: center;
  }

  .search-results.empty p {
    margin: 0;
    color: #9ca3af;
    font-size: 0.9rem;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f3f4f6;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover {
    background-color: #f3f4f6;
  }

  .result-item:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .result-name {
    font-weight: 500;
    color: #111827;
    font-size: 0.9rem;
  }

  .result-email {
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.2rem;
  }

  .companions-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }

  .list-header {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    align-items: center;
  }

  .permission-col {
    text-align: center;
    min-width: 100px;
  }

  .action-col {
    width: 32px;
  }

  .companion-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    align-items: center;
    background-color: #ffffff;
    transition: background-color 0.2s;
  }

  .companion-item:hover {
    background-color: #f9fafb;
  }

  .companion-item:last-child {
    border-bottom: none;
  }

  .companion-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .companion-email {
    font-size: 0.9rem;
    color: #111827;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .permission-toggle {
    padding: 0.4rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background-color: #ffffff;
    font-size: 0.85rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;
    text-align: center;
  }

  .permission-toggle:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .permission-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #d1d5db;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0;
    transition: color 0.2s;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn:hover {
    color: #ef4444;
  }

  .remove-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .no-companions {
    margin: 1rem 0;
    color: #9ca3af;
    font-size: 0.9rem;
    text-align: center;
  }
</style>
