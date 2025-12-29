<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';

  export let tripId: string = '';
  export let currentItemCompanions: any[] = [];
  export let onCompanionsChange: ((companions: any[]) => void) | null = null;

  let allTripCompanions: any[] = [];
  let selectedCompanionIds: Set<string> = new Set();

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

  function toggleCompanion(companionId: string) {
    if (selectedCompanionIds.has(companionId)) {
      selectedCompanionIds.delete(companionId);
    } else {
      selectedCompanionIds.add(companionId);
    }
    selectedCompanionIds = selectedCompanionIds; // Trigger reactivity

    // Notify parent of change
    if (onCompanionsChange) {
      const selected = allTripCompanions.filter(c => selectedCompanionIds.has(c.id));
      onCompanionsChange(selected);
    }
  }

  function getCompanionInitials(email: string): string {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  }

  function getCompanionColor(email: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B88B', '#A9CCE3'
    ];
    const charCode = email.charCodeAt(0);
    return colors[charCode % colors.length];
  }
</script>

<div class="companions-selector">
  {#if allTripCompanions && allTripCompanions.length > 0}
    <div class="companions-list">
      {#each allTripCompanions as companion (companion.id)}
        <label class="companion-checkbox">
          <input
            type="checkbox"
            checked={selectedCompanionIds.has(companion.id)}
            on:change={() => toggleCompanion(companion.id)}
          />
          <div class="companion-info">
            <div
              class="companion-avatar"
              style="background-color: {getCompanionColor(companion.email)}"
              title={companion.email}
            >
              {getCompanionInitials(companion.email)}
            </div>
            <div class="companion-details">
              <span class="companion-email">{companion.email}</span>
              {#if companion.canEdit}
                <span class="permission-badge">Can edit</span>
              {:else}
                <span class="permission-badge view-only">View only</span>
              {/if}
            </div>
          </div>
        </label>
      {/each}
    </div>
  {:else}
    <p class="no-companions">No companions added to this trip yet.</p>
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
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3b82f6;
    flex-shrink: 0;
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
</style>
