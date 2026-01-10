<script lang="ts">
  import { onMount } from 'svelte';
  import { tripsApi, itemTripApi } from '$lib/services/api';
  import Alert from './Alert.svelte';

  export let itemType: string;
  export let itemId: string;
  export let currentTripId: string | null = null;
  export let onUpdate: ((tripIds: string[]) => void) | null = null;

  interface Trip {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
  }

  let availableTrips: Trip[] = [];
  let selectedTripIds: Set<string> = new Set();
  let loadingTrips = true;
  let loadingUpdate = false;
  let error: string | null = null;

  onMount(async () => {
    await loadTrips();
    await loadItemTrips();
  });

  async function loadTrips() {
    try {
      loadingTrips = true;
      const trips = await tripsApi.getAll();
      availableTrips = Array.isArray(trips) ? trips : trips?.data || [];
    } catch (err) {
      console.error('Failed to load trips:', err);
      error = err instanceof Error ? err.message : 'Failed to load trips';
      availableTrips = [];
    } finally {
      loadingTrips = false;
    }
  }

  async function loadItemTrips() {
    try {
      if (!itemTripApi) return;

      const response = await itemTripApi.getItemTrips(itemType, itemId);
      const tripIds = Array.isArray(response)
        ? response.map((t: any) => t.tripId)
        : response?.data?.map((t: any) => t.tripId) || [];

      selectedTripIds = new Set(tripIds);
    } catch (err) {
      console.error('Failed to load item trips:', err);
      // Don't show error for this since it might be a new item
    }
  }

  async function handleTripToggle(tripId: string, isChecked: boolean) {
    const newSet = new Set(selectedTripIds);

    if (isChecked) {
      newSet.add(tripId);
    } else {
      newSet.delete(tripId);
    }

    selectedTripIds = newSet;
  }

  async function handleSaveTrips() {
    try {
      loadingUpdate = true;
      error = null;

      const tripIds = Array.from(selectedTripIds);

      if (!itemTripApi) {
        throw new Error('Item trips API not available');
      }

      await itemTripApi.setItemTrips(itemType, itemId, tripIds);

      if (onUpdate) {
        onUpdate(tripIds);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update trips';
      console.error('[ItemTripsSelector] Error saving trips:', err);
    } finally {
      loadingUpdate = false;
    }
  }

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '';
    }
  }

  function getTripLabel(trip: Trip): string {
    let label = trip.name;
    if (trip.startDate) {
      label += ` (${formatDate(trip.startDate)}`;
      if (trip.endDate) {
        label += ` - ${formatDate(trip.endDate)}`;
      }
      label += ')';
    }
    return label;
  }
</script>

<div class="item-trips-selector">
  <h4 class="section-title">Trips</h4>

  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if loadingTrips}
    <div class="loading-state">
      <p>Loading trips...</p>
    </div>
  {:else if availableTrips.length === 0}
    <div class="empty-state">
      <p>No trips available</p>
    </div>
  {:else}
    <div class="trips-list">
      {#each availableTrips as trip (trip.id)}
        <label class="trip-checkbox-item">
          <input
            type="checkbox"
            checked={selectedTripIds.has(trip.id)}
            on:change={(e) => handleTripToggle(trip.id, e.currentTarget.checked)}
            disabled={loadingUpdate}
            class="checkbox-input"
          />
          <span class="trip-label">{getTripLabel(trip)}</span>
          {#if trip.id === currentTripId}
            <span class="current-badge">Current</span>
          {/if}
        </label>
      {/each}
    </div>

    <div class="action-buttons">
      <button
        on:click={handleSaveTrips}
        disabled={loadingUpdate}
        class="save-btn"
      >
        {loadingUpdate ? 'Saving...' : 'Save Trip Selection'}
      </button>
    </div>
  {/if}
</div>

<style>
  .item-trips-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .loading-state,
  .empty-state {
    padding: 1rem;
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 0.425rem;
    text-align: center;
  }

  .loading-state p,
  .empty-state p {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .trips-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    overflow: hidden;
  }

  .trip-checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.15s;
    user-select: none;
  }

  .trip-checkbox-item:last-child {
    border-bottom: none;
  }

  .trip-checkbox-item:hover {
    background-color: #f9fafb;
  }

  .trip-checkbox-item:has(input:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .checkbox-input {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: #3b82f6;
    flex-shrink: 0;
  }

  .checkbox-input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .trip-label {
    flex: 1;
    font-size: 0.8rem;
    color: #111827;
    word-break: break-word;
  }

  .current-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: #dbeafe;
    color: #1e40af;
    border-radius: 0.325rem;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .save-btn {
    flex: 1;
    padding: 0.75rem;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 0.425rem;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    min-height: 2.25rem;
  }

  .save-btn:hover:not(:disabled) {
    background-color: #059669;
  }

  .save-btn:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
</style>
