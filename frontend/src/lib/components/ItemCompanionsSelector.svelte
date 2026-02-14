<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';
  import { companionsApi } from '$lib/services/api';
  import { getCompanionInitials } from '$lib/utils/companionFormatter';
  import { getAvatarColor } from '$lib/composables/useCompanionAvatars';
  import { onMount } from 'svelte';

  export let tripId: string = '';
  export let currentItemCompanions: any[] = [];
  export let onCompanionsChange: ((companions: any[]) => void) | null = null;

  let allTripCompanions: any[] = [];
  let allAvailableCompanions: any[] = [];
  let selectedCompanionIds: Set<string> = new Set();
  let loading = false;

  // Load all available companions for standalone items
  async function loadAllCompanions() {
    if (!tripId) {
      loading = true;
      try {
        const data = await companionsApi.getAll();
        allAvailableCompanions = Array.isArray(data) ? data : (data?.data || []);
      } catch (err) {
        console.error('Failed to load companions:', err);
        allAvailableCompanions = [];
      } finally {
        loading = false;
      }
    }
  }

  // Load on mount
  onMount(() => {
    loadAllCompanions();
  });

  // Subscribe to trip store to get trip data with companions
  tripStore.subscribe(state => {
    if (state.currentTrip && state.currentTrip.travelCompanions) {
      allTripCompanions = state.currentTrip.travelCompanions;
    }
  });

  // When currentItemCompanions change, update selectedCompanionIds
  $: if (currentItemCompanions && currentItemCompanions.length > 0) {
    selectedCompanionIds = new Set(currentItemCompanions.map(c => c.id));
  }

  // Determine which companions to display
  $: displayCompanions = tripId ? allTripCompanions : allAvailableCompanions;

  function toggleCompanion(companionId: string) {
    if (selectedCompanionIds.has(companionId)) {
      selectedCompanionIds.delete(companionId);
    } else {
      selectedCompanionIds.add(companionId);
    }
    selectedCompanionIds = selectedCompanionIds; // Trigger reactivity

    // Notify parent of change
    if (onCompanionsChange) {
      const selected = displayCompanions.filter(c => selectedCompanionIds.has(c.id));
      onCompanionsChange(selected);
    }
  }
</script>

<div class="companions-selector">
  {#if loading}
    <p class="loading-message">Loading companions...</p>
  {:else if displayCompanions && displayCompanions.length > 0}
    <div class="companions-list">
      {#each displayCompanions as companion (companion.id)}
        <label class="companion-checkbox">
          <input
            type="checkbox"
            checked={selectedCompanionIds.has(companion.id)}
            on:change={() => toggleCompanion(companion.id)}
          />
          <div class="companion-info">
            <div
              class="companion-avatar"
              style="background-color: {getAvatarColor(companion.email)}"
              title={companion.email}
            >
              {getCompanionInitials(companion)}
            </div>
            <div class="companion-details">
              <span class="companion-email">{companion.email}</span>
              {#if companion.canEdit}
                <span class="permission-badge">Can edit</span>
              {:else if tripId}
                <span class="permission-badge view-only">View only</span>
              {/if}
            </div>
          </div>
        </label>
      {/each}
    </div>
  {:else}
    <p class="no-companions">{tripId ? 'No companions added to this trip yet.' : 'No companions available yet.'}</p>
  {/if}
</div>

<style>
  .companions-selector {
    padding: 0.5rem 0;
  }

  .companions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .companion-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .companion-checkbox:hover {
    background-color: #f5f5f5;
  }

  .companion-checkbox input[type='checkbox'] {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
    accent-color: var(--color-primary);
    flex-shrink: 0;
    -webkit-appearance: checkbox;
    appearance: checkbox;
  }

  .companion-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .companion-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: white;
    font-size: 0.85rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .companion-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .companion-email {
    font-size: 0.9rem;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .permission-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    background-color: #e0e7ff;
    color: #3b82f6;
    font-weight: 600;
    width: fit-content;
  }

  .permission-badge.view-only {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  .no-companions {
    color: #999;
    font-size: 0.9rem;
    text-align: center;
    padding: 1rem 0;
  }

  .loading-message {
    color: #666;
    font-size: 0.9rem;
    text-align: center;
    padding: 1rem 0;
  }
</style>
