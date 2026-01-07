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
  export let onTripExpand: (tripId: string) => void = () => {};
  export let onTripHover: (tripId: string | null) => void = () => {};
  export let onItemHover: (itemType: string | null, itemId: string | null) => void = () => {};
  export let onItemClick: (itemType: string, data: any) => void = () => {};
  export let onTripEdit: (trip: any, event: Event) => void = () => {};

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
                on:click={(e) => onTripEdit(item.data, e)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && onTripEdit(item.data, e as any)}
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
                      on:click={(e) => onTripEdit(item.data, e)}
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

              <!-- Trip Items (Accordion Content) -->
              {#if expandedTrips.has(item.data.id)}
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
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
  }

  .timeline-date-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-left: 0;
    margin-bottom: 1rem;
    border-left: none;
  }

  .timeline-date-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
  }

  .date-badge {
    display: inline-block;
    padding: 0.4rem 0;
    background: transparent;
    color: #007bff;
    border: none;
    border-radius: 0;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.1rem;
    font-style: oblique;
  }

  .timeline-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Trip Card Styles */
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

  .trip-card.unconfirmed::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 3px,
        rgba(150, 150, 150, 0.08) 3px,
        rgba(150, 150, 150, 0.08) 6px
      );
    pointer-events: none;
    border-radius: inherit;
    z-index: 1;
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
</style>
