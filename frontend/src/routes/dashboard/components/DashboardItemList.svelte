<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import CompanionIndicators from '$lib/components/CompanionIndicators.svelte';
  import { getCityName, getTransportIcon } from '$lib/utils/dashboardItem';
  import { formatMonthHeader, formatDateTime, formatDateOnly, formatTimeOnly } from '$lib/utils/dashboardFormatters';

  export let filteredItems: any[] = [];
  export let groupedItems: Record<string, Array<any>> = {};
  export let dateKeysInOrder: string[] = [];
  export let highlightedItemId: string | null = null;
  export let highlightedItemType: string | null = null;

  const dispatch = createEventDispatcher();

  // Debug: Log all events to console
  $: {
    filteredItems.forEach((item) => {
      if (item.itemType === 'event') {
        const startDate = new Date(item.data.startDateTime);
        const endDate = new Date(item.data.endDateTime);
        console.log(`[Event Debug] ${item.data.name}:`, {
          startDateTime: item.data.startDateTime,
          endDateTime: item.data.endDateTime,
          startUTC: `${startDate.getUTCHours()}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`,
          endUTC: `${endDate.getUTCHours()}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`,
          isAllDay: item.data.isAllDay,
          timezone: item.data.timezone,
        });
      }
    });
  }

  const handleItemHover = (itemType: string, itemId: string) => {
    dispatch('hoverItem', { itemType, itemId });
  };

  const handleItemLeave = () => {
    dispatch('leaveItem');
  };

  const handleItemClick = (itemType: string, data: any) => {
    dispatch('itemClick', { itemType, data });
  };
</script>

<div class="items-list-container">
  {#if dateKeysInOrder.length > 0}
    {#each dateKeysInOrder as dateKey (dateKey)}
      <div class="timeline-date-group">
        <div class="timeline-date-header">
          <span class="date-badge">{formatMonthHeader(dateKey)}</span>
        </div>
        <div class="timeline-items">
          {#each groupedItems[dateKey] as item (item.type === 'trip' ? item.data.id : `${item.itemType}-${item.data.id}`)}
            {#if item.type === 'standalone'}
              <!-- Standalone Item Card -->
              {#if item.itemType === 'flight'}
                <div
                  class="item-card"
                  class:item-highlighted={highlightedItemId === item.data.id && highlightedItemType === 'flight'}
                  on:mouseenter={() => handleItemHover('flight', item.data.id)}
                  on:mouseleave={handleItemLeave}
                  on:click={() => handleItemClick('flight', item.data)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleItemClick('flight', item.data)}
                >
                  <div class="item-icon-wrapper">
                    <p class="item-time-label">{formatTimeOnly(item.data.departureDateTime, item.data.originTimezone)}</p>
                    <div class="item-icon blue">
                      <span class="material-symbols-outlined">flight</span>
                    </div>
                  </div>
                  <div class="item-content">
                    <p class="item-title">{item.data.flightNumber}</p>
                    <p class="item-route">
                      {getCityName(item.data.origin)} → {getCityName(item.data.destination)}
                    </p>
                  </div>
                  {#if item.data.itemCompanions && item.data.itemCompanions.length > 0}
                    <div class="item-companions">
                      <CompanionIndicators companions={item.data.itemCompanions} />
                    </div>
                  {/if}
                </div>
              {:else if item.itemType === 'hotel'}
                <div
                  class="item-card"
                  class:item-highlighted={highlightedItemId === item.data.id && highlightedItemType === 'hotel'}
                  on:mouseenter={() => handleItemHover('hotel', item.data.id)}
                  on:mouseleave={handleItemLeave}
                  on:click={() => handleItemClick('hotel', item.data)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleItemClick('hotel', item.data)}
                >
                  <div class="item-icon green">
                    <span class="material-symbols-outlined">hotel</span>
                  </div>
                  <div class="item-content">
                    <p class="item-title">{item.data.hotelName || item.data.name}</p>
                    <p class="item-dates">{formatDateOnly(item.data.checkInDateTime, item.data.timezone)} - {formatDateOnly(item.data.checkOutDateTime, item.data.timezone)}</p>
                    <p class="item-route">{getCityName(item.data.address) || getCityName(item.data.city)}</p>
                  </div>
                  {#if item.data.itemCompanions && item.data.itemCompanions.length > 0}
                    <div class="item-companions">
                      <CompanionIndicators companions={item.data.itemCompanions} />
                    </div>
                  {/if}
                </div>
              {:else if item.itemType === 'transportation'}
                <div
                  class="item-card"
                  on:mouseenter={() => handleItemHover('transportation', item.data.id)}
                  on:mouseleave={handleItemLeave}
                  on:click={() => handleItemClick('transportation', item.data)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleItemClick('transportation', item.data)}
                >
                  <div class="item-icon-wrapper">
                    <p class="item-time-label">{formatTimeOnly(item.data.departureDateTime, item.data.originTimezone)}</p>
                    <div class="item-icon red">
                      <span class="material-symbols-outlined">{getTransportIcon(item.data.method)}</span>
                    </div>
                  </div>
                  <div class="item-content">
                    <p class="item-title">{item.data.method ? item.data.method.charAt(0).toUpperCase() + item.data.method.slice(1) : 'Transportation'}</p>
                    <p class="item-route">
                      {getCityName(item.data.origin)} → {getCityName(item.data.destination)}
                    </p>
                  </div>
                  {#if item.data.itemCompanions && item.data.itemCompanions.length > 0}
                    <div class="item-companions">
                      <CompanionIndicators companions={item.data.itemCompanions} />
                    </div>
                  {/if}
                </div>
              {:else if item.itemType === 'carRental'}
                <div
                  class="item-card"
                  on:mouseenter={() => handleItemHover('carRental', item.data.id)}
                  on:mouseleave={handleItemLeave}
                  on:click={() => handleItemClick('carRental', item.data)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleItemClick('carRental', item.data)}
                >
                  <div class="item-icon gray">
                    <span class="material-symbols-outlined">directions_car</span>
                  </div>
                  <div class="item-content">
                    <p class="item-title">{item.data.company}</p>
                    <p class="item-time">{formatDateTime(item.data.pickupDateTime, item.data.pickupTimezone)}</p>
                    <p class="item-route">{getCityName(item.data.pickupLocation)}</p>
                  </div>
                  {#if item.data.itemCompanions && item.data.itemCompanions.length > 0}
                    <div class="item-companions">
                      <CompanionIndicators companions={item.data.itemCompanions} />
                    </div>
                  {/if}
                </div>
              {:else if item.itemType === 'event'}
                <div
                  class="item-card"
                  on:mouseenter={() => handleItemHover('event', item.data.id)}
                  on:mouseleave={handleItemLeave}
                  on:click={() => handleItemClick('event', item.data)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleItemClick('event', item.data)}
                >
                  {#if item.data.isAllDay}
                    <div class="item-icon purple">
                      <span class="material-symbols-outlined">event</span>
                    </div>
                  {:else}
                    <div class="item-icon-wrapper">
                      <p class="item-time-label">{formatTimeOnly(item.data.startDateTime, item.data.timezone)}</p>
                      <div class="item-icon purple">
                        <span class="material-symbols-outlined">event</span>
                      </div>
                    </div>
                  {/if}
                  <div class="item-content">
                    <p class="item-title">{item.data.name}</p>
                    {#if item.data.isAllDay}
                      {#if item.data.startDateTime && item.data.endDateTime && item.data.startDateTime !== item.data.endDateTime}
                        <p class="item-time">{formatDateOnly(item.data.startDateTime, item.data.timezone)} - {formatDateOnly(item.data.endDateTime, item.data.timezone)}</p>
                      {:else}
                        <p class="item-time">{formatDateOnly(item.data.startDateTime, item.data.timezone)}</p>
                      {/if}
                    {:else}
                      <p class="item-time">{formatDateTime(item.data.startDateTime, item.data.timezone)}</p>
                    {/if}
                    <p class="item-route">{item.data.location}</p>
                  </div>
                  {#if item.data.itemCompanions && item.data.itemCompanions.length > 0}
                    <div class="item-companions">
                      <CompanionIndicators companions={item.data.itemCompanions} />
                    </div>
                  {/if}
                </div>
              {/if}
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .items-list-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
    overflow-y: auto;
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

  .item-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .item-card:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .item-card.item-highlighted {
    background: #f0f9ff;
    border-color: #3b82f6;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
  }

  .item-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .item-time-label {
    margin: 0;
    font-size: 0.6rem;
    font-weight: 600;
    color: #6b7280;
    line-height: 1;
    text-align: center;
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
    font-size: 1.3rem !important;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    margin: 0 0 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    line-height: 1;
    text-align: left;
  }

  .item-time {
    margin: 0.2rem 0 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1;
    text-align: left;
  }

  .item-dates {
    margin: 0.2rem 0 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1;
    text-align: left;
  }

  .item-route {
    margin: 0.2rem 0 0;
    font-size: 0.75rem;
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
