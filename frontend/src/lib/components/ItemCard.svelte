<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import CompanionIndicators from './CompanionIndicators.svelte';
  import { getCityName, getTransportIcon } from '$lib/utils/dashboardItem';
  import { formatDateTime, formatDateOnly, formatTimeOnly, capitalize } from '$lib/utils/dashboardFormatters';

  export let item: any;
  export let itemType: 'flight' | 'hotel' | 'transportation' | 'carRental' | 'event';
  export let isHighlighted: boolean = false;
  export let isUnconfirmed: boolean = false;
  export let showCompanions: boolean = true;
  export let excludeUserId: string | null = null;
  export let canEdit: boolean = true;

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click', { item, itemType });
  }

  function handleMouseEnter() {
    dispatch('mouseenter', { item, itemType });
  }

  function handleMouseLeave() {
    dispatch('mouseleave', { item, itemType });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleClick();
    }
  }

  // Get icon color class based on item type
  function getIconColor(): string {
    const colorMap: Record<string, string> = {
      flight: 'blue',
      hotel: 'green',
      transportation: 'red',
      carRental: 'gray',
      event: 'purple'
    };
    return colorMap[itemType] || 'gray';
  }

  // Get icon name based on item type
  function getIconName(): string {
    switch (itemType) {
      case 'flight':
        return 'flight';
      case 'hotel':
        return 'hotel';
      case 'transportation':
        return getTransportIcon(item.method || 'train');
      case 'carRental':
        return 'directions_car';
      case 'event':
        return 'event';
      default:
        return 'check_circle';
    }
  }

  // Determine if this item has a time that should be displayed
  function hasTime(): boolean {
    switch (itemType) {
      case 'flight':
        return !!item.departureDateTime;
      case 'hotel':
        return false;
      case 'transportation':
        return !!item.departureDateTime;
      case 'carRental':
        return false;
      case 'event':
        return !item.isAllDay && !!item.startDateTime;
      default:
        return false;
    }
  }

  // Get time label for display
  function getTimeLabel(): string {
    switch (itemType) {
      case 'flight':
        return formatTimeOnly(item.departureDateTime, item.originTimezone);
      case 'transportation':
        return formatTimeOnly(item.departureDateTime, item.originTimezone);
      case 'event':
        return !item.isAllDay ? formatTimeOnly(item.startDateTime, item.timezone) : '';
      default:
        return '';
    }
  }

  // Get title for the item
  function getTitle(): string {
    switch (itemType) {
      case 'flight':
        return item.flightNumber || 'Flight';
      case 'hotel':
        return item.hotelName || item.name || 'Hotel';
      case 'transportation':
        return capitalize(item.method || 'Transportation');
      case 'carRental':
        return item.company || 'Car Rental';
      case 'event':
        return item.name || 'Event';
      default:
        return '';
    }
  }

  // Get route/location info
  function getRoute(): string {
    switch (itemType) {
      case 'flight':
        return `${getCityName(item.origin)} → ${getCityName(item.destination)}`;
      case 'hotel':
        return getCityName(item.address) || getCityName(item.city) || '';
      case 'transportation':
        return `${getCityName(item.origin)} → ${getCityName(item.destination)}`;
      case 'carRental':
        return getCityName(item.pickupLocation) || '';
      case 'event':
        return item.location || '';
      default:
        return '';
    }
  }

  // Get dates/times for secondary info
  function getSecondaryInfo(): string {
    switch (itemType) {
      case 'flight':
        return formatDateTime(item.departureDateTime, item.originTimezone);
      case 'hotel':
        return `${formatDateOnly(item.checkInDateTime, item.timezone)} - ${formatDateOnly(item.checkOutDateTime, item.timezone)}`;
      case 'transportation':
        return formatDateTime(item.departureDateTime, item.originTimezone);
      case 'carRental':
        return formatDateTime(item.pickupDateTime, item.pickupTimezone);
      case 'event':
        if (item.isAllDay) {
          if (item.startDateTime && item.endDateTime && item.startDateTime !== item.endDateTime) {
            return `${formatDateOnly(item.startDateTime, item.timezone)} - ${formatDateOnly(item.endDateTime, item.timezone)}`;
          } else {
            return formatDateOnly(item.startDateTime, item.timezone);
          }
        } else {
          return formatDateTime(item.startDateTime, item.timezone);
        }
      default:
        return '';
    }
  }
</script>

<div
  class="item-card"
  class:item-highlighted={isHighlighted}
  class:unconfirmed={isUnconfirmed}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
  role="button"
  tabindex="0"
  on:keydown={handleKeyDown}
>
  {#if hasTime()}
    <div class="item-icon-wrapper">
      <p class="item-time-label">{getTimeLabel()}</p>
      <div class="item-icon {getIconColor()}">
        <span class="material-symbols-outlined">{getIconName()}</span>
      </div>
    </div>
  {:else}
    <div class="item-icon {getIconColor()}">
      <span class="material-symbols-outlined">{getIconName()}</span>
    </div>
  {/if}

  <div class="item-content">
    <p class="item-title">{getTitle()}</p>
    <p class="item-info">{getSecondaryInfo()}</p>
    {#if getRoute()}
      <p class="item-route">{getRoute()}</p>
    {/if}
  </div>

  {#if showCompanions && item.itemCompanions && item.itemCompanions.length > 0}
    <div class="item-companions">
      <CompanionIndicators companions={item.itemCompanions} excludeUserId={excludeUserId} />
    </div>
  {/if}
</div>

<style>
  .item-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-light);
    border-radius: 0.425rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .item-card:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .item-card.item-highlighted {
    background: var(--color-primary-bg);
    border-color: var(--color-primary);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
  }

  .item-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .item-time-label {
    margin: 0;
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-text-secondary);
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
    background: var(--color-primary);
  }

  .item-icon.green {
    background: var(--color-success);
  }

  .item-icon.red {
    background: var(--color-error);
  }

  .item-icon.gray {
    background: var(--color-text-secondary);
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
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .item-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
    text-align: left;
  }

  .item-info {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    line-height: 1;
    text-align: left;
  }

  .item-route {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    line-height: 1;
    text-align: left;
    font-style: italic;
  }

  .item-companions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: absolute;
    top: 0.45rem;
    right: 0.45rem;
  }

  .read-only-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .read-only-badge :global(.material-symbols-outlined) {
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Unconfirmed item styling with diagonal hash pattern */
  .item-card.unconfirmed::before {
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
</style>
