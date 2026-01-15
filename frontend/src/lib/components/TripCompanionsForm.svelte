<script lang="ts">
  import { companionsApi } from '$lib/services/api';
  import CompanionsFormSection from './CompanionsFormSection.svelte';

  /**
   * TripCompanionsForm - Wrapper around CompanionsFormSection for trip-level companion management
   * Handles adding companions to trips and toggling their edit permissions
   */

  export let tripId: string;
  export let companions: any[] = [];
  export let tripOwnerId: string | null = null;
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;

  /**
   * Handle adding companion to trip
   */
  async function handleAddCompanion(companion: any) {
    const newCompanion = await companionsApi.addToTrip(tripId, companion.id, false);
    return newCompanion;
  }

  /**
   * Handle removing companion from trip
   */
  async function handleRemoveCompanion(companionId: string) {
    await companionsApi.removeFromTrip(tripId, companionId);
  }
</script>

<div class="trip-companions-wrapper">
  <CompanionsFormSection
    type="trip"
    entityId={tripId}
    {companions}
    canEdit={true}
    {tripOwnerId}
    {onCompanionsUpdate}
    onAddCompanion={handleAddCompanion}
    onRemoveCompanion={handleRemoveCompanion}
  />
</div>

<style>
  .trip-companions-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
  }
</style>
