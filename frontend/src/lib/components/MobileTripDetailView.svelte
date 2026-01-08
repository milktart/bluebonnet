<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MapVisualization from './MapVisualization.svelte';
  import ItemCard from './ItemCard.svelte';
  import ItemEditForm from './ItemEditForm.svelte';
  import { groupTripItemsByDate, getDayKeyForItem } from '$lib/utils/dashboardGrouping';
  import { formatTripDateHeader, formatDateTime, formatTimeOnly, formatDateOnly, formatDate, calculateNights, capitalize } from '$lib/utils/dashboardFormatters';
  import { getCityName, getTransportIcon } from '$lib/utils/dashboardItem';
  import CompanionIndicators from './CompanionIndicators.svelte';
  import '$lib/styles/form-styles.css';

  export let tripData: any = null;
  export let selectedItem: any = null;
  export let itemType: string | null = null;
  export let isPast: boolean = false;
  export let allTrips: any[] = [];

  const dispatch = createEventDispatcher();

  let mapComponent: any = null;
  let selectedTripItem: any = null;
  let selectedTripItemType: string | null = null;

  // Export for parent access
  export function getMapComponent() {
    return mapComponent;
  }

  function handleBack() {
    if (selectedTripItem) {
      selectedTripItem = null;
      selectedTripItemType = null;
    } else {
      dispatch('back');
    }
  }

  function handleEdit() {
    dispatch('edit', { item: selectedItem, itemType });
  }

  function handleDelete() {
    dispatch('delete', { item: selectedItem, itemType });
  }

  function handleTripItemClick(event: any) {
    selectedTripItem = { ...event.detail.item, tripId: selectedItem?.id };
    selectedTripItemType = event.detail.itemType;
  }

  function handleTripItemBackClick() {
    selectedTripItem = null;
    selectedTripItemType = null;
  }

  // Get trip items grouped by date (only if this is a trip)
  function getTripItemsByDate() {
    if (itemType === 'trip' && selectedItem?.flights) {
      return groupTripItemsByDate(selectedItem);
    }
    return {};
  }

  // Filter tripData to only show items from the selected trip or standalone item
  function getFilteredTripData() {
    if (!tripData || !selectedItem) {
      return tripData;
    }

    // For standalone items, show only that item on the map
    if (itemType !== 'trip') {
      return {
        flights: itemType === 'flight' ? [selectedItem] : [],
        hotels: itemType === 'hotel' ? [selectedItem] : [],
        events: itemType === 'event' ? [selectedItem] : [],
        transportation: itemType === 'transportation' ? [selectedItem] : [],
        carRentals: itemType === 'carRental' ? [selectedItem] : []
      };
    }

    // If a specific trip item is selected, only show that item
    if (selectedTripItem && selectedTripItemType) {
      return {
        flights: selectedTripItemType === 'flight' ? [selectedTripItem] : [],
        hotels: selectedTripItemType === 'hotel' ? [selectedTripItem] : [],
        events: selectedTripItemType === 'event' ? [selectedTripItem] : [],
        transportation: selectedTripItemType === 'transportation' ? [selectedTripItem] : [],
        carRentals: selectedTripItemType === 'carRental' ? [selectedTripItem] : []
      };
    }

    const tripId = selectedItem.id;
    return {
      flights: tripData.flights?.filter((f: any) => f.tripId === tripId) || [],
      hotels: tripData.hotels?.filter((h: any) => h.tripId === tripId) || [],
      events: tripData.events?.filter((e: any) => e.tripId === tripId) || [],
      transportation: tripData.transportation?.filter((t: any) => t.tripId === tripId) || [],
      carRentals: tripData.carRentals?.filter((c: any) => c.tripId === tripId) || []
    };
  }
</script>

<div class="mobile-detail-view">
  <!-- Top half: Map -->
  <div class="map-section">
    <div id="tripDetailMap" class="detail-map-container">
      {#key JSON.stringify(selectedItem)}
        <MapVisualization
          bind:this={mapComponent}
          tripData={getFilteredTripData()}
          {isPast}
          isMobile={true}
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
          <!-- Trip Timeline View or Item Edit View -->
          {#if selectedTripItem && selectedTripItemType}
            <!-- Item Edit View -->
            <div class="trip-header">
              <button type="button" class="back-arrow" aria-label="Back to trip" on:click={handleTripItemBackClick}>
                <span class="material-symbols-outlined">arrow_back</span>
              </button>
              <div class="trip-header-content">
                <h3 class="trip-title">{selectedTripItem.name || selectedTripItem.flightNumber || selectedTripItem.hotelName || 'Item'}</h3>
              </div>
            </div>
            <div class="trip-items-timeline item-edit-form">
              <ItemEditForm
                data={selectedTripItem}
                itemType={selectedTripItemType}
                tripId={selectedItem?.id}
                {allTrips}
                isMobile={true}
                onClose={handleTripItemBackClick}
                onSave={() => {
                  handleTripItemBackClick();
                  dispatch('itemUpdated');
                }}
              />
            </div>
          {:else}
            <!-- Trip Timeline View -->
            <div class="trip-header">
              <button type="button" class="back-arrow" aria-label="Back to list" on:click={handleBack}>
                <span class="material-symbols-outlined">arrow_back</span>
              </button>
              <div class="trip-header-content">
                <div class="trip-title-line">
                  <h3 class="trip-title">{selectedItem.name}</h3>
                  {#if selectedItem.purpose}
                    <span class="purpose-badge" class:leisure={selectedItem.purpose.toLowerCase() === 'leisure'} class:business={selectedItem.purpose.toLowerCase() === 'business'}>
                      {capitalize(selectedItem.purpose)}
                    </span>
                  {/if}
                </div>
                <div class="trip-meta">
                  <div class="trip-date-line">
                    <div class="date-time-section">
                      <div class="nights-badge">
                        <span class="material-symbols-outlined">moon_stars</span>
                        <span>{calculateNights(selectedItem.departureDate, selectedItem.returnDate)}</span>
                      </div>
                      <p class="trip-dates">{formatDate(selectedItem.departureDate)} - {formatDate(selectedItem.returnDate || selectedItem.departureDate)}</p>
                    </div>
                    {#if selectedItem.tripCompanions && selectedItem.tripCompanions.length > 0}
                      <div class="trip-companions-mobile">
                        <CompanionIndicators companions={selectedItem.tripCompanions} />
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
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
                      <ItemCard
                        {item}
                        itemType={item.type}
                        isHighlighted={selectedTripItem?.id === item.id}
                        isUnconfirmed={item.isConfirmed === false}
                        showCompanions={true}
                        on:click={handleTripItemClick}
                      />
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else}
          <!-- Single Item Details View -->
          <div class="item-header">
            <button type="button" class="back-arrow" aria-label="Back to list" on:click={handleBack}>
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <div class="item-header-content">
              <h3 class="item-title">{selectedItem.name || selectedItem.title || 'Item Details'}</h3>
              {#if selectedItem.type}
                <span class="item-type-badge">{selectedItem.type}</span>
              {/if}
            </div>
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
          {:else if itemType === 'event' || selectedItem.startDateTime}
            {#if selectedItem.name}
              <div class="detail-row">
                <span class="label">Event Name</span>
                <span class="value">{selectedItem.name || 'N/A'}</span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="label">Location</span>
              <span class="value">{selectedItem.location || 'N/A'}</span>
            </div>
            {#if selectedItem.startDateTime}
              <div class="detail-row">
                <span class="label">Start</span>
                <span class="value">{formatDateTime(selectedItem.startDateTime, selectedItem.timezone) || 'N/A'}</span>
              </div>
            {/if}
            {#if selectedItem.endDateTime}
              <div class="detail-row">
                <span class="label">End</span>
                <span class="value">{formatDateTime(selectedItem.endDateTime, selectedItem.timezone) || 'N/A'}</span>
              </div>
            {/if}
            {#if selectedItem.category}
              <div class="detail-row">
                <span class="label">Category</span>
                <span class="value">{capitalize(selectedItem.category) || 'N/A'}</span>
              </div>
            {/if}
            {#if selectedItem.description}
              <div class="detail-row">
                <span class="label">Description</span>
                <span class="value">{selectedItem.description || 'N/A'}</span>
              </div>
            {/if}
            {#if selectedItem.ticketNumber}
              <div class="detail-row">
                <span class="label">Ticket Number</span>
                <span class="value">{selectedItem.ticketNumber || 'N/A'}</span>
              </div>
            {/if}
            {#if selectedItem.cost}
              <div class="detail-row">
                <span class="label">Cost</span>
                <span class="value">{selectedItem.cost || 'N/A'}</span>
              </div>
            {/if}
            {#if selectedItem.url}
              <div class="detail-row">
                <span class="label">URL</span>
                <span class="value">
                  <a href={selectedItem.url} target="_blank" rel="noopener noreferrer">{selectedItem.url}</a>
                </span>
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
        <div class="form-buttons">
          <button type="button" class="submit-btn" on:click={handleEdit}>Edit</button>
          <button type="button" class="cancel-btn" on:click={handleBack}>Back</button>
        </div>
        <button type="button" class="delete-btn" on:click={handleDelete}>Delete</button>
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

  /* Map Section (top 40% in portrait, 0% in landscape) */
  .map-section {
    position: relative;
    flex: 0 0 40%;
    background: #f0f0f0;
    border-bottom: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .detail-map-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  /* Details Section (bottom 60% in portrait, full height in landscape) */
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
    padding-bottom: calc(1rem + 60px + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }


  .back-arrow {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    flex-shrink: 0;
    transition: all 0.15s;
    border-radius: 0.425rem;
    width: 1.75rem;
    height: 1.75rem;
  }

  .back-arrow:hover {
    color: #4b5563;
    background-color: #f3f4f6;
  }

  .back-arrow:active {
    background-color: #e5e7eb;
  }

  .back-arrow :global(.material-symbols-outlined) {
    font-size: 1.5rem !important;
  }

  .item-header {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.75rem;
  }

  .item-header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .item-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
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
    width: fit-content;
  }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
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
    display: flex;
    gap: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.5rem;
    background: #fff;
    flex-shrink: 0;
    z-index: 10;
    min-height: 0;
  }

  .trip-header-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .trip-title-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .trip-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    word-break: break-word;
    line-height: 1.2;
  }

  .trip-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .trip-date-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .date-time-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .trip-dates {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    white-space: nowrap;
  }

  .purpose-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .purpose-badge.leisure {
    background: #dcfce7;
    color: #166534;
  }

  .purpose-badge.business {
    background: #dbeafe;
    color: #0c4a6e;
  }

  .nights-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    background: #f3f4f6;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
  }

  .nights-badge :global(.material-symbols-outlined) {
    font-size: 0.875rem !important;
  }

  .trip-companions-mobile {
    display: flex;
    gap: 0.25rem;
  }

  .trip-items-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0.5rem;
    padding-bottom: calc(0.5rem + 60px + env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .trip-items-timeline.item-edit-form {
    gap: 1rem;
    padding: 0.5rem;
    padding-bottom: calc(0.5rem + 60px + env(safe-area-inset-bottom, 0px));
    min-height: 0;
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

  /* Only show on mobile */
  @media (min-width: 640px) {
    .mobile-detail-view {
      display: none;
    }
  }
</style>
