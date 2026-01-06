<script lang="ts">
  import { dashboardStore, dashboardStoreActions } from '$lib/stores/dashboardStore';
  import CompanionIndicators from '$lib/components/CompanionIndicators.svelte';
  import { getTripIcon, getTripCities } from '$lib/utils/dashboardItem';
  import { formatDate, formatTripDateHeader, calculateNights } from '$lib/utils/dashboardFormatters';
  import { groupTripItemsByDate, getDayKeyForItem } from '$lib/utils/dashboardGrouping';

  let trips: any[] = [];
  let filteredItems: any[] = [];
  let expandedTrips = new Set<string>();
  let highlightedTripId: string | null = null;
  let highlightedItemId: string | null = null;
  let highlightedItemType: string | null = null;

  // Subscribe to store
  const unsubscribe = dashboardStore.subscribe(($store) => {
    trips = $store.trips;
    filteredItems = $store.filteredItems;
    expandedTrips = $store.expandedTrips;
    highlightedTripId = $store.highlightedTripId;
    highlightedItemId = $store.highlightedItemId;
    highlightedItemType = $store.highlightedItemType;
  });

  const handleTripExpand = (tripId: string) => {
    dashboardStoreActions.toggleTripExpanded(tripId);
  };

  const handleTripHover = (tripId: string) => {
    dashboardStoreActions.setHighlightedTrip(tripId);
  };

  const handleTripLeave = () => {
    dashboardStoreActions.setHighlightedTrip(null);
  };

  const handleEditTrip = (trip: any, event: Event) => {
    event.stopPropagation();
    dashboardStoreActions.openSecondarySidebar({ type: 'trip', itemType: 'trip', data: trip });
  };

  const handleItemHover = (itemType: string, itemId: string) => {
    dashboardStoreActions.setHighlightedItem(itemId, itemType);
  };

  const handleItemLeave = () => {
    dashboardStoreActions.setHighlightedItem(null, null);
  };

  const handleItemClick = (itemType: string, data: any) => {
    dashboardStoreActions.openSecondarySidebar({ type: itemType, itemType, data });
  };

  // Helper function to get icon color for item type
  function getItemIconColor(itemType: string): string {
    const colorMap: Record<string, string> = {
      flight: 'blue',
      hotel: 'green',
      transportation: 'red',
      carRental: 'gray',
      event: 'purple'
    };
    return colorMap[itemType] || 'gray';
  }

  // Helper function to get icon name for item type
  function getItemIcon(itemType: string, item?: any): string {
    if (itemType === 'flight') return 'flight';
    if (itemType === 'hotel') return 'hotel';
    if (itemType === 'carRental') return 'directions_car';
    if (itemType === 'event') return 'event';
    if (itemType === 'transportation') {
      const { getTransportIcon } = require('$lib/utils/dashboardItem');
      return getTransportIcon(item?.method || 'train');
    }
    return 'check_circle';
  }

  // Filter to only show trip items from filteredItems
  const tripItems = filteredItems.filter(item => item.type === 'trip');
</script>

<div class="trips-list-container">
  {#each tripItems as item (item.data.id)}
    <div
      class="trip-card"
      class:expanded={expandedTrips.has(item.data.id)}
      class:highlighted={highlightedTripId === item.data.id}
      on:mouseenter={() => handleTripHover(item.data.id)}
      on:mouseleave={handleTripLeave}
    >
      <!-- Trip Header -->
      <div
        class="trip-header"
        on:click={() => handleTripExpand(item.data.id)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && handleTripExpand(item.data.id)}
      >
        <div class="trip-icon-column">
          <div class="trip-icon-container">
            <span class="material-symbols-outlined trip-icon">
              {getTripIcon(item.data.purpose)}
            </span>
          </div>
          <div class="trip-nights">
            <span class="material-symbols-outlined nights-icon">nights</span>
            <span class="nights-number">{calculateNights(item.data.departureDate, item.data.returnDate)}</span>
          </div>
        </div>

        <div class="trip-info">
          <div class="trip-name-row">
            <h3 class="trip-name">{item.data.name}</h3>
            <button
              class="edit-btn"
              title="Edit trip details and companions"
              on:click={(e) => handleEditTrip(item.data, e)}
            >
              <span class="material-symbols-outlined">edit</span>
            </button>
          </div>
          <p class="trip-dates">
            {formatDate(item.data.departureDate)} - {formatDate(item.data.returnDate || item.data.departureDate)}
          </p>
          {#if getTripCities(item.data)}
            <p class="trip-cities">{getTripCities(item.data)}</p>
          {/if}
        </div>

        <button
          class="expand-btn"
          class:rotated={expandedTrips.has(item.data.id)}
          on:click={(e) => {
            e.stopPropagation();
            handleTripExpand(item.data.id);
          }}
        >
          <span class="material-symbols-outlined">expand_more</span>
        </button>
      </div>

      {#if item.data.tripCompanions && item.data.tripCompanions.length > 0}
        <div class="trip-companions">
          <CompanionIndicators companions={item.data.tripCompanions} />
        </div>
      {/if}

      <!-- Trip Items (Accordion Content) - Date-level Timeline -->
      {#if expandedTrips.has(item.data.id)}
        <div class="trip-items">
          {#each Object.keys(groupTripItemsByDate(item.data)) as dayKey (dayKey)}
            <div class="trip-item-date-group">
              <div class="trip-item-date-header">
                <span class="trip-date-badge">{formatTripDateHeader(dayKey)}</span>
              </div>
              <div class="trip-item-date-items">
                {#each groupTripItemsByDate(item.data)[dayKey] as tripItem (tripItem.id)}
                  {#if tripItem.type === 'flight'}
                    <div
                      class="item-card"
                      class:item-highlighted={highlightedItemId === tripItem.id && highlightedItemType === 'flight'}
                      on:mouseenter={() => handleItemHover('flight', tripItem.id)}
                      on:mouseleave={handleItemLeave}
                      on:click={() => handleItemClick('flight', tripItem)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && handleItemClick('flight', tripItem)}
                    >
                      <div class="item-icon blue">
                        <span class="material-symbols-outlined">flight</span>
                      </div>
                      <div class="item-content">
                        <p class="item-title">{tripItem.flightNumber}</p>
                        <p class="item-info">
                          {tripItem.origin ? tripItem.origin.substring(0, 3).toUpperCase() : '?'} → {tripItem.destination ? tripItem.destination.substring(0, 3).toUpperCase() : '?'}
                        </p>
                      </div>
                      {#if tripItem.itemCompanions && tripItem.itemCompanions.length > 0}
                        <div class="item-companions">
                          <CompanionIndicators companions={tripItem.itemCompanions} />
                        </div>
                      {/if}
                    </div>
                  {:else if tripItem.type === 'hotel'}
                    <div
                      class="item-card"
                      class:item-highlighted={highlightedItemId === tripItem.id && highlightedItemType === 'hotel'}
                      on:mouseenter={() => handleItemHover('hotel', tripItem.id)}
                      on:mouseleave={handleItemLeave}
                      on:click={() => handleItemClick('hotel', tripItem)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && handleItemClick('hotel', tripItem)}
                    >
                      <div class="item-icon green">
                        <span class="material-symbols-outlined">hotel</span>
                      </div>
                      <div class="item-content">
                        <p class="item-title">{tripItem.hotelName || tripItem.name}</p>
                        <p class="item-info">{tripItem.address || tripItem.city}</p>
                      </div>
                      {#if tripItem.itemCompanions && tripItem.itemCompanions.length > 0}
                        <div class="item-companions">
                          <CompanionIndicators companions={tripItem.itemCompanions} />
                        </div>
                      {/if}
                    </div>
                  {:else if tripItem.type === 'transportation'}
                    <div
                      class="item-card"
                      on:mouseenter={() => handleItemHover('transportation', tripItem.id)}
                      on:mouseleave={handleItemLeave}
                      on:click={() => handleItemClick('transportation', tripItem)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && handleItemClick('transportation', tripItem)}
                    >
                      <div class="item-icon red">
                        <span class="material-symbols-outlined">train</span>
                      </div>
                      <div class="item-content">
                        <p class="item-title">{tripItem.method ? tripItem.method.charAt(0).toUpperCase() + tripItem.method.slice(1) : 'Transportation'}</p>
                        <p class="item-info">
                          {tripItem.origin ? tripItem.origin.substring(0, 3).toUpperCase() : '?'} → {tripItem.destination ? tripItem.destination.substring(0, 3).toUpperCase() : '?'}
                        </p>
                      </div>
                      {#if tripItem.itemCompanions && tripItem.itemCompanions.length > 0}
                        <div class="item-companions">
                          <CompanionIndicators companions={tripItem.itemCompanions} />
                        </div>
                      {/if}
                    </div>
                  {:else if tripItem.type === 'carRental'}
                    <div
                      class="item-card"
                      on:mouseenter={() => handleItemHover('carRental', tripItem.id)}
                      on:mouseleave={handleItemLeave}
                      on:click={() => handleItemClick('carRental', tripItem)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && handleItemClick('carRental', tripItem)}
                    >
                      <div class="item-icon gray">
                        <span class="material-symbols-outlined">directions_car</span>
                      </div>
                      <div class="item-content">
                        <p class="item-title">{tripItem.company}</p>
                        <p class="item-info">{tripItem.pickupLocation || 'Car Rental'}</p>
                      </div>
                      {#if tripItem.itemCompanions && tripItem.itemCompanions.length > 0}
                        <div class="item-companions">
                          <CompanionIndicators companions={tripItem.itemCompanions} />
                        </div>
                      {/if}
                    </div>
                  {:else if tripItem.type === 'event'}
                    <div
                      class="item-card"
                      on:mouseenter={() => handleItemHover('event', tripItem.id)}
                      on:mouseleave={handleItemLeave}
                      on:click={() => handleItemClick('event', tripItem)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && handleItemClick('event', tripItem)}
                    >
                      <div class="item-icon purple">
                        <span class="material-symbols-outlined">event</span>
                      </div>
                      <div class="item-content">
                        <p class="item-title">{tripItem.name}</p>
                        <p class="item-info">{tripItem.location}</p>
                      </div>
                      {#if tripItem.itemCompanions && tripItem.itemCompanions.length > 0}
                        <div class="item-companions">
                          <CompanionIndicators companions={tripItem.itemCompanions} />
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .trips-list-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 0;
  }

  .trip-card {
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
    background: #ffffff90;
    overflow: hidden;
    transition: all 0.2s;
    position: relative;
  }

  .trip-card:hover,
  .trip-card.highlighted {
    background: #f3f4f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .trip-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
  }

  .trip-header:hover {
    background: #f9f9f9;
  }

  .trip-icon-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .trip-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.425rem;
    background: #f0f0f0;
    flex-shrink: 0;
  }

  .trip-icon {
    font-size: 0.875rem !important;
    color: #28536b;
  }

  .trip-nights {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.65rem;
    color: #4b5563;
    white-space: nowrap;
  }

  .nights-icon {
    font-size: 0.7rem !important;
    color: #6b7280;
  }

  .nights-number {
    font-weight: 600;
    color: #111827;
  }

  .trip-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .trip-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: -2px;
  }

  .trip-name {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: #111827;
    line-height: 1;
    text-align: left;
  }

  .trip-dates {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #4b5563;
    line-height: 1;
    text-align: left;
  }

  .trip-cities {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #6b7280;
    font-style: italic;
    line-height: 1;
    text-align: left;
  }

  .edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #9ca3af;
    opacity: 0;
    transition: opacity 0.2s, color 0.2s;
    font-size: 0.75rem;
    width: 1rem;
    height: 1rem;
    margin-top: -2px;
  }

  .trip-card:hover .edit-btn {
    opacity: 1;
  }

  .edit-btn:hover {
    color: #3b82f6;
  }

  .edit-btn :global(.material-symbols-outlined) {
    font-size: 0.9rem !important;
  }

  .expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.3s;
  }

  .expand-btn.rotated :global(.material-symbols-outlined) {
    transform: rotate(180deg);
  }

  .trip-companions {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .trip-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 0.5rem 0.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .trip-card.expanded .trip-items {
    border-top: none;
  }

  .trip-item-date-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-left: 0;
    margin: 0.75rem 0 0 0;
    border-left: none;
  }

  .trip-card.expanded .trip-item-date-group {
    padding-left: 0.5rem;
    border-left: 1px solid #007bff;
  }

  .trip-item-date-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.15rem 0px;
  }

  .trip-date-badge {
    display: inline-block;
    padding: 0.2rem 0;
    background: transparent;
    color: #666;
    border: none;
    border-radius: 0;
    font-size: 0.65rem;
    font-weight: 700;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05rem;
  }

  .trip-item-date-items {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .item-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .item-card:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .item-card.item-highlighted {
    background: #f0f9ff;
    border-color: #3b82f6;
  }

  .item-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .item-icon.blue {
    background: #3b82f6;
  }

  .item-icon.green {
    background: #10b981;
  }

  .item-icon.red {
    background: #ef4444;
  }

  .item-icon.gray {
    background: #6b7280;
  }

  .item-icon.purple {
    background: #a855f7;
  }

  .item-icon :global(.material-symbols-outlined) {
    font-size: 1rem !important;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #111827;
    line-height: 1;
    text-align: left;
  }

  .item-info {
    margin: 0.2rem 0 0 0;
    font-size: 0.65rem;
    color: #6b7280;
    line-height: 1;
    text-align: left;
  }

  .item-companions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
  }
</style>
