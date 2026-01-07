<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MapVisualization from './MapVisualization.svelte';

  export let tripData: any = null;
  export let selectedItem: any = null;
  export let itemType: string | null = null;
  export let isPast: boolean = false;

  const dispatch = createEventDispatcher();

  let mapComponent: any = null;

  // Export for parent access
  export function getMapComponent() {
    return mapComponent;
  }

  function handleBack() {
    dispatch('back');
  }

  function handleEdit() {
    dispatch('edit', { item: selectedItem, itemType });
  }

  function handleDelete() {
    dispatch('delete', { item: selectedItem, itemType });
  }
</script>

<div class="mobile-detail-view">
  <!-- Top half: Map -->
  <div class="map-section">
    <button type="button" class="back-button" aria-label="Back to list" on:click={handleBack}>
      ← Back
    </button>
    <div id="tripDetailMap" class="detail-map-container">
      {#key JSON.stringify(selectedItem)}
        <MapVisualization
          bind:this={mapComponent}
          {tripData}
          {isPast}
          highlightedTripId={selectedItem?.tripId || null}
          highlightedItemType={itemType}
          highlightedItemId={selectedItem?.id || null}
        />
      {/key}
    </div>
  </div>

  <!-- Bottom half: Details -->
  <div class="details-section">
    <div class="details-content">
      {#if selectedItem}
        <div class="item-header">
          <h3 class="item-title">{selectedItem.name || selectedItem.title || 'Item Details'}</h3>
          {#if selectedItem.type}
            <span class="item-type-badge">{selectedItem.type}</span>
          {/if}
        </div>

        <div class="item-details">
          <!-- Render item details based on type -->
          {#if itemType === 'flight' || selectedItem.flightNumber}
            <div class="detail-row">
              <span class="label">Flight</span>
              <span class="value">{selectedItem.flightNumber || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">From</span>
              <span class="value">{selectedItem.departureAirport || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">To</span>
              <span class="value">{selectedItem.arrivalAirport || 'N/A'}</span>
            </div>
            {#if selectedItem.departureTime}
              <div class="detail-row">
                <span class="label">Departure</span>
                <span class="value">{new Date(selectedItem.departureTime).toLocaleString()}</span>
              </div>
            {/if}
          {:else if itemType === 'hotel' || selectedItem.checkInDate}
            <div class="detail-row">
              <span class="label">Location</span>
              <span class="value">{selectedItem.city || selectedItem.location || 'N/A'}</span>
            </div>
            {#if selectedItem.checkInDate}
              <div class="detail-row">
                <span class="label">Check-in</span>
                <span class="value">{new Date(selectedItem.checkInDate).toLocaleDateString()}</span>
              </div>
            {/if}
            {#if selectedItem.checkOutDate}
              <div class="detail-row">
                <span class="label">Check-out</span>
                <span class="value">{new Date(selectedItem.checkOutDate).toLocaleDateString()}</span>
              </div>
            {/if}
          {:else if itemType === 'event' || selectedItem.eventDate}
            <div class="detail-row">
              <span class="label">Location</span>
              <span class="value">{selectedItem.location || 'N/A'}</span>
            </div>
            {#if selectedItem.eventDate}
              <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">{new Date(selectedItem.eventDate).toLocaleDateString()}</span>
              </div>
            {/if}
          {:else if itemType === 'transportation' || selectedItem.transportationType}
            <div class="detail-row">
              <span class="label">Type</span>
              <span class="value">{selectedItem.transportationType || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">From</span>
              <span class="value">{selectedItem.pickupLocation || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">To</span>
              <span class="value">{selectedItem.dropoffLocation || 'N/A'}</span>
            </div>
          {:else if itemType === 'carRental' || selectedItem.rentalCompany}
            <div class="detail-row">
              <span class="label">Company</span>
              <span class="value">{selectedItem.rentalCompany || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Vehicle</span>
              <span class="value">{selectedItem.vehicleType || 'N/A'}</span>
            </div>
            {#if selectedItem.pickupDate}
              <div class="detail-row">
                <span class="label">Pickup</span>
                <span class="value">{new Date(selectedItem.pickupDate).toLocaleDateString()}</span>
              </div>
            {/if}
          {/if}

          {#if selectedItem.notes}
            <div class="detail-row notes-row">
              <span class="label">Notes</span>
              <span class="value">{selectedItem.notes}</span>
            </div>
          {/if}
        </div>

        <!-- Action buttons -->
        <div class="action-buttons">
          <button type="button" class="btn btn-primary" on:click={handleEdit}>Edit</button>
          <button type="button" class="btn btn-danger" on:click={handleDelete}>Delete</button>
        </div>
      {:else}
        <p class="no-selection">Select an item to view details</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .mobile-detail-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: #fff;
  }

  /* Map Section (top 40%) */
  .map-section {
    position: relative;
    flex: 0 0 40%;
    background: #f0f0f0;
    border-bottom: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .back-button {
    position: absolute;
    top: max(0.5rem, env(safe-area-inset-top, 0.5rem));
    left: max(0.5rem, env(safe-area-inset-left, 0.5rem));
    z-index: 10;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #2563eb;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .back-button:active {
    background: #f3f4f6;
  }

  .detail-map-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  /* Details Section (bottom 60%) */
  .details-section {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .details-content {
    padding: 1rem;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .item-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    flex: 1;
    word-break: break-word;
  }

  .item-type-badge {
    background: #2563eb;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-row.notes-row {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
  }

  .label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 0.875rem;
    color: #111827;
    word-break: break-word;
  }

  .no-selection {
    text-align: center;
    color: #9ca3af;
    padding: 2rem 1rem;
    margin: 0;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: auto;
  }

  .btn {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:active {
    background: #1d4ed8;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:active {
    background: #dc2626;
  }

  /* Scrollbar styling for details section */
  .details-section::-webkit-scrollbar {
    width: 4px;
  }

  .details-section::-webkit-scrollbar-track {
    background: #f3f4f6;
  }

  .details-section::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  .details-section::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  /* Only show on mobile */
  @media (min-width: 640px) {
    .mobile-detail-view {
      display: none;
    }
  }
</style>
