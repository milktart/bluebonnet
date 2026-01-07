<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MapVisualization from './MapVisualization.svelte';
  import { groupTripItemsByDate, getDayKeyForItem } from '$lib/utils/dashboardGrouping';
  import { formatTripDateHeader, formatDateTime, formatTimeOnly, formatDateOnly } from '$lib/utils/dashboardFormatters';
  import { getCityName, getTransportIcon } from '$lib/utils/dashboardItem';
  import { capitalize } from '$lib/utils/dashboardFormatters';

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

  // Get trip items grouped by date (only if this is a trip)
  function getTripItemsByDate() {
    if (itemType === 'trip' && selectedItem?.flights) {
      return groupTripItemsByDate(selectedItem);
    }
    return {};
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
          highlightedTripId={itemType === 'trip' ? selectedItem?.id : selectedItem?.tripId}
          highlightedItemType={itemType === 'trip' ? null : itemType}
          highlightedItemId={itemType === 'trip' ? null : selectedItem?.id}
        />
      {/key}
    </div>
  </div>

  <!-- Bottom half: Details -->
  <div class="details-section">
    <div class="details-content">
      {#if selectedItem}
        {#if itemType === 'trip'}
          <!-- Trip Timeline View -->
          <div class="trip-header">
            <h3 class="trip-title">{selectedItem.name}</h3>
            <p class="trip-dates">{selectedItem.departureDate} - {selectedItem.returnDate || selectedItem.departureDate}</p>
          </div>

          <!-- Timeline of trip items -->
          <div class="trip-items-timeline">
            {#each Object.keys(getTripItemsByDate()).sort() as dayKey (dayKey)}
              <div class="timeline-day-group">
                <div class="timeline-day-header">
                  <span class="day-badge">{formatTripDateHeader(dayKey)}</span>
                </div>
                <div class="timeline-day-items">
                  {#each getTripItemsByDate()[dayKey] as item (item.id)}
                    <div class="timeline-item-card">
                      <div class="item-icon-wrapper">
                        {#if item.type === 'flight'}
                          <p class="flight-time">{formatTimeOnly(item.departureDateTime, item.originTimezone)}</p>
                          <div class="item-icon blue">
                            <span class="material-symbols-outlined">flight</span>
                          </div>
                        {:else if item.type === 'hotel'}
                          <div class="item-icon green">
                            <span class="material-symbols-outlined">hotel</span>
                          </div>
                        {:else if item.type === 'transportation'}
                          <p class="flight-time">{formatTimeOnly(item.departureDateTime, item.originTimezone)}</p>
                          <div class="item-icon red">
                            <span class="material-symbols-outlined">{getTransportIcon(item.method)}</span>
                          </div>
                        {:else if item.type === 'carRental'}
                          <div class="item-icon gray">
                            <span class="material-symbols-outlined">directions_car</span>
                          </div>
                        {:else if item.type === 'event'}
                          <div class="item-icon purple">
                            <span class="material-symbols-outlined">event</span>
                          </div>
                        {/if}
                      </div>
                      <div class="item-info">
                        <p class="item-title">
                          {item.type === 'flight' ? item.flightNumber : item.type === 'hotel' ? (item.hotelName || item.name) : item.type === 'carRental' ? item.company : item.type === 'event' ? item.name : capitalize(item.method)}
                        </p>
                        {#if item.type === 'hotel'}
                          <p class="item-date">{formatDateOnly(item.checkInDateTime, item.timezone)} - {formatDateOnly(item.checkOutDateTime, item.timezone)}</p>
                        {:else}
                          <p class="item-date">{formatDateTime(item.departureDateTime || item.pickupDateTime || item.startDateTime, item.originTimezone || item.pickupTimezone || item.timezone)}</p>
                        {/if}
                        <p class="item-location">
                          {#if item.type === 'flight'}
                            {getCityName(item.origin)} → {getCityName(item.destination)}
                          {:else if item.type === 'hotel'}
                            {getCityName(item.address) || getCityName(item.city)}
                          {:else if item.type === 'transportation'}
                            {getCityName(item.origin)} → {getCityName(item.destination)}
                          {:else if item.type === 'carRental'}
                            {getCityName(item.pickupLocation)}
                          {:else if item.type === 'event'}
                            {item.location}
                          {/if}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Single Item Details View -->
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
        {/if}
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

  /* Trip Timeline View Styles */
  .trip-header {
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .trip-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    word-break: break-word;
  }

  .trip-dates {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .trip-items-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .timeline-day-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .timeline-day-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .day-badge {
    padding: 0.25rem 0.75rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .timeline-day-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .timeline-item-card {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    align-items: flex-start;
  }

  .item-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    position: relative;
  }

  .flight-time {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #4b5563;
    min-width: 35px;
    text-align: center;
  }

  .item-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .item-icon.blue {
    background: #dbeafe;
    color: #0284c7;
  }

  .item-icon.green {
    background: #dbeafe;
    color: #16a34a;
  }

  .item-icon.red {
    background: #fee2e2;
    color: #dc2626;
  }

  .item-icon.gray {
    background: #f3f4f6;
    color: #6b7280;
  }

  .item-icon.purple {
    background: #f3e8ff;
    color: #9333ea;
  }

  .item-icon :global(.material-symbols-outlined) {
    font-size: 1.3rem !important;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
  }

  .timeline-item-card .item-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: #111827;
    line-height: 1;
    text-align: left;
  }

  .timeline-item-card .item-date {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #4b5563;
    line-height: 1;
    text-align: left;
  }

  .timeline-item-card .item-location {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #6b7280;
    line-height: 1;
    text-align: left;
    font-style: italic;
  }

  /* Only show on mobile */
  @media (min-width: 640px) {
    .mobile-detail-view {
      display: none;
    }
  }
</style>
