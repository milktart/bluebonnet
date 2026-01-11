<script lang="ts">
  import ItemCard from './ItemCard.svelte';
  import CompanionIndicators from './CompanionIndicators.svelte';
  import { formatDate, formatMonthHeader, formatTripDateHeader, calculateNights } from '$lib/utils/dashboardFormatters';
  import { getTripIcon, getTripCities } from '$lib/utils/dashboardItem';
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

  // Debug reactive statement
  $: {
    console.log('[ItemsList] expandedTrips updated:', Array.from(expandedTrips));
    console.log('[ItemsList] excludeUserId prop:', excludeUserId);
  }

  function handleTripExpand(tripId: string) {
    console.log('[ItemsList.handleTripExpand] Called with tripId:', tripId, 'isExpanded:', expandedTrips.has(tripId));
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
                  <div class="trip-nights">
                    <span class="material-symbols-outlined nights-icon">moon_stars</span>
                    <span class="nights-number">{calculateNights(item.data.departureDate, item.data.returnDate)}</span>
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

              <!-- Trip Items (Accordion Content) - Desktop only -->
              {#if expandedTrips.has(item.data.id) && typeof window !== 'undefined' && window.innerWidth >= 640}
                <div class="trip-items">
                  {#each Object.keys(groupTripItemsByDate(item.data)) as dayKey (dayKey)}
                    <div class="trip-item-date-group">
                      <div class="trip-item-date-header">
                        <span class="trip-date-badge">{formatTripDateHeader(dayKey)}</span>
                      </div>
                      <div class="trip-item-date-items">
                        {#each groupTripItemsByDate(item.data)[dayKey] as tripItem (tripItem.id)}
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

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
  }
</style>
