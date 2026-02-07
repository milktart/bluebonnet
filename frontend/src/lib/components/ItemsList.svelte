<script lang="ts">
  import ItemCard from './ItemCard.svelte';
  import CompanionIndicators from './CompanionIndicators.svelte';
  import { formatDate, formatMonthHeader, formatTripDateHeader, calculateNights } from '$lib/utils/dashboardFormatters';
  import { getTripIcon, getTripCities, calculateLayover, checkLongLayoverWithoutAccommodation } from '$lib/utils/dashboardItem';
  import { groupTripItemsByDate } from '$lib/utils/dashboardGrouping';

  // Props
  export let items: any[] = []; // Mixed trips and standalone items from groupedItems
  export let dateKeys: string[] = []; // Keys in order from dateKeysInOrder
  export let expandedTrips = new Set<string>();
  export let highlightedTripId: string | null = null;
  export let highlightedItemId: string | null = null;
  export let highlightedItemType: string | null = null;
  export let excludeUserId: string | null = null; // User ID to exclude from companion indicators
  export let onTripExpand: (tripId: string) => void = () => {};
  export let onTripHover: (tripId: string | null) => void = () => {};
  export let onItemHover: (itemType: string | null, itemId: string | null) => void = () => {};
  export let onItemClick: (itemType: string, data: any) => void = () => {};
  export let onTripCardClick: (trip: any, event: Event) => void = () => {};
  export let onEditIconClick: (trip: any, event: Event) => void = () => {};

  function handleTripExpand(tripId: string) {
    onTripExpand(tripId);
  }

  function handleItemCardClick(detail: any) {
    onItemClick(detail.itemType, detail.item);
  }

  function handleItemCardMouseEnter(detail: any) {
    onItemHover(detail.itemType, detail.item.id);
  }

  function handleItemCardMouseLeave() {
    onItemHover(null, null);
  }

  function getLayoverInfo(items: any[], currentIndex: number): { duration: string; location: string } | null {
    if (currentIndex >= items.length - 1) return null;

    const currentItem = items[currentIndex];
    const nextItem = items[currentIndex + 1];

    // Only check layover between consecutive flights
    if (currentItem.type === 'flight' && nextItem.type === 'flight') {
      return calculateLayover(currentItem, nextItem);
    }

    return null;
  }

  function handleAddAccommodation(trip: any, flightId: string) {
    const layoverInfo = checkLongLayoverWithoutAccommodation(trip, flightId);
    if (!layoverInfo) return;

    // Find the flight to get arrival info
    const flight = trip.flights?.find((f: any) => f.id === flightId);
    if (!flight) return;

    // Create prepopulated hotel data
    const hotelData = {
      tripId: trip.id,
      checkInDate: flight.arrivalDateTime.substring(0, 10), // Extract date from ISO string
      checkInTime: flight.arrivalDateTime.substring(11, 16), // Extract time
      checkOutDate: layoverInfo.nextItemDate.substring(0, 10),
      checkOutTime: layoverInfo.nextItemDate.substring(11, 16),
      timezone: flight.destinationTimezone || 'UTC'
    };

    // Dispatch event to parent to open the hotel form
    // Using a custom event since we need to pass complex data
    const event = new CustomEvent('openHotelForm', {
      detail: {
        tripId: trip.id,
        hotelData
      }
    });
    window.dispatchEvent(event);
  }
</script>

<div class="items-list">
  {#each dateKeys as dateKey (dateKey)}
    <div class="timeline-date-group">
      <!-- Date Header -->
      <div class="timeline-date-header">
        <span class="date-badge">{formatMonthHeader(dateKey)}</span>
      </div>

      <!-- Items for this date -->
      <div class="timeline-items">
        {#each items.filter(item => {
          // Filter items to only show those for current dateKey
          const itemDateKey = item.type === 'trip'
            ? item.data.departureDate?.substring(0, 7)
            : item.type === 'standalone' && item.itemType === 'flight'
            ? new Date(item.data.departureDateTime).toISOString().substring(0, 7)
            : item.type === 'standalone' && item.itemType === 'hotel'
            ? new Date(item.data.checkInDateTime).toISOString().substring(0, 7)
            : item.type === 'standalone' && item.itemType === 'transportation'
            ? new Date(item.data.departureDateTime).toISOString().substring(0, 7)
            : item.type === 'standalone' && item.itemType === 'carRental'
            ? new Date(item.data.pickupDateTime).toISOString().substring(0, 7)
            : item.type === 'standalone' && item.itemType === 'event'
            ? new Date(item.data.startDateTime).toISOString().substring(0, 7)
            : null;
          return itemDateKey === dateKey.substring(0, 7);
        }) as item (item.type === 'trip' ? item.data.id : `${item.itemType}-${item.data.id}`)}
          {#if item.type === 'trip'}
            <!-- Trip Card -->
            <div
              class="trip-card"
              class:expanded={expandedTrips.has(item.data.id)}
              class:highlighted={highlightedTripId === item.data.id}
              class:unconfirmed={item.data.isConfirmed === false}
              on:mouseenter={() => onTripHover(item.data.id)}
              on:mouseleave={() => onTripHover(null)}
            >
              <!-- Trip Header -->
              <div
                class="trip-header"
                on:click={(e) => onTripCardClick(item.data, e)}
                role="button"
                tabindex="0"
              >
                <div class="trip-icon-column">
                  <div class="trip-icon-container">
                    <span class="material-symbols-outlined trip-icon">
                      {getTripIcon(item.data.purpose)}
                    </span>
                  </div>
                </div>

                <div class="trip-info">
                  <div class="trip-name-row">
                    <h3 class="trip-name">{item.data.name}</h3>
                    <button
                      class="edit-btn"
                      title="Edit trip details and companions"
                      on:click={(e) => onEditIconClick(item.data, e)}
                    >
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                  <p class="trip-dates">
                    <span class="trip-nights">
                      <span class="nights-number">{calculateNights(item.data.departureDate, item.data.returnDate)}</span>
                      <span class="material-symbols-outlined nights-icon">moon_stars</span>
                    </span>
                    {formatDate(item.data.departureDate)} - {formatDate(item.data.returnDate || item.data.departureDate)}
                  </p>
                  {#if getTripCities(item.data)}
                    <p class="trip-cities">{getTripCities(item.data)}</p>
                  {/if}
                </div>

                {#if typeof window !== 'undefined' && window.innerWidth >= 640}
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
                {/if}
              </div>

              {#if item.data.tripCompanions && item.data.tripCompanions.length > 0}
                <div class="trip-companions">
                  <CompanionIndicators companions={item.data.tripCompanions} excludeUserId={excludeUserId} />
                </div>
              {/if}

              <!-- Trip Items (Accordion Content) - Desktop and Mobile -->
              {#if expandedTrips.has(item.data.id)}
                <div class="trip-items">
                  {#each Object.keys(groupTripItemsByDate(item.data)) as dayKey (dayKey)}
                    <div class="trip-item-date-group">
                      <div class="trip-item-date-header">
                        <span class="trip-date-badge">{formatTripDateHeader(dayKey)}</span>
                      </div>
                      <div class="trip-item-date-items">
                        {#each groupTripItemsByDate(item.data)[dayKey] as tripItem, idx (tripItem.id)}
                          <ItemCard
                            item={tripItem}
                            itemType={tripItem.type}
                            isHighlighted={highlightedItemId === tripItem.id && highlightedItemType === tripItem.type}
                            isUnconfirmed={tripItem.isConfirmed === false}
                            canEdit={tripItem.canEdit !== false}
                            {excludeUserId}
                            on:click={(e) => handleItemCardClick(e.detail)}
                            on:mouseenter={(e) => handleItemCardMouseEnter(e.detail)}
                            on:mouseleave={handleItemCardMouseLeave}
                          />
                          {#if tripItem.type === 'flight'}
                            {@const longLayoverInfo = checkLongLayoverWithoutAccommodation(item.data, tripItem.id)}
                            {#if longLayoverInfo}
                              <button
                                class="accommodation-suggestion-card"
                                on:click={() => handleAddAccommodation(item.data, tripItem.id)}
                                title="Add accommodation for this layover"
                              >
                                <div class="accommodation-icon">
                                  <span class="material-symbols-outlined">hotel</span>
                                </div>
                                <div class="accommodation-content">
                                  <p class="accommodation-title">Need accommodation?</p>
                                  <p class="accommodation-subtitle">
                                    {longLayoverInfo.duration} layover in {longLayoverInfo.location}
                                  </p>
                                </div>
                              </button>
                            {/if}
                          {/if}
                          {#if idx < groupTripItemsByDate(item.data)[dayKey].length - 1}
                            {@const layoverInfo = getLayoverInfo(groupTripItemsByDate(item.data)[dayKey], idx)}
                            {#if layoverInfo}
                              <div class="layover-bar">
                                <div class="layover-line"></div>
                                <span class="layover-duration">{layoverInfo.duration}</span>
                                <div class="layover-line"></div>
                              </div>
                            {/if}
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else if item.type === 'standalone'}
            <!-- Standalone Item -->
            <ItemCard
              item={item.data}
              itemType={item.itemType}
              isHighlighted={highlightedItemId === item.data.id && highlightedItemType === item.itemType}
              isUnconfirmed={item.data.isConfirmed === false}
              canEdit={item.data.canEdit !== false}
              {excludeUserId}
              on:click={(e) => handleItemCardClick(e.detail)}
              on:mouseenter={(e) => handleItemCardMouseEnter(e.detail)}
              on:mouseleave={handleItemCardMouseLeave}
            />
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  @import '$lib/styles/timeline.css';

  .layover-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.65rem;
    font-weight: 500;
    color: #6b7280;
  }

  .layover-line {
    flex: 1;
    height: 1px;
    background-color: #d1d5db;
    margin: 0 10px;
  }

  .layover-duration {
    white-space: nowrap;
    color: #4b5563;
    font-weight: 600;
  }

  .accommodation-suggestion-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border: 2px dashed #d1d5db;
    border-radius: 0.425rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    text-align: left;
    font-size: inherit;
    font-family: inherit;
  }

  .accommodation-suggestion-card:hover {
    border-color: #9ca3af;
    background: #f9fafb;
  }

  .accommodation-suggestion-card:active {
    background: #f3f4f6;
  }

  .accommodation-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background: #10b981;
    color: white;
    flex-shrink: 0;
  }

  .accommodation-icon :global(.material-symbols-outlined) {
    font-size: 1.3rem !important;
  }

  .accommodation-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .accommodation-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: #111827;
    line-height: 1;
  }

  .accommodation-subtitle {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #6b7280;
    line-height: 1;
  }
</style>
