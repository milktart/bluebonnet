<script lang="ts">
  import { onMount } from 'svelte';
  import { tripsApi } from '$lib/services/api';

  export let tripId: string;
  export let onItemClick: (type: string, id: string) => void = () => {};

  interface TimelineItem {
    type: 'flight' | 'hotel' | 'transportation' | 'carRental' | 'event';
    id: string;
    time: Date;
    timezone?: string;
    data: any;
    display: string;
    icon: string;
    color: string;
  }

  interface DateGroup {
    date: string;
    items: TimelineItem[];
  }

  let dateGroups: DateGroup[] = [];
  let loading = true;
  let error: string | null = null;
  let tripData: any = null;

  const itemColors: Record<string, string> = {
    flight: '#3b82f6',
    hotel: '#10b981',
    transportation: '#f59e0b',
    carRental: '#6b7280',
    event: '#ef4444'
  };

  const itemIcons: Record<string, string> = {
    flight: 'flight',
    hotel: 'hotel',
    transportation: 'train',
    carRental: 'directions_car',
    event: 'event'
  };

  function getTransportationIcon(method: string): string {
    const icons: Record<string, string> = {
      'train': 'train',
      'bus': 'directions_bus',
      'ferry': 'directions_boat',
      'shuttle': 'airport_shuttle',
      'taxi/rideshare': 'hail',
      'subway/metro': 'directions_subway',
      'tram': 'tram',
      'funicular': 'funicular_railway',
      'gondola': 'gondola_lift',
      'monorail': 'monorail',
      'other': 'directions_boat'
    };
    return icons[method] || 'transportation';
  }

  function getCityName(location: string): string {
    if (!location) return '';
    // Remove country in parentheses if present
    return location.split('(')[0].trim();
  }

  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '';
    }
  }

  async function loadTrip() {
    try {
      loading = true;
      tripData = await tripsApi.getOne(tripId);
      buildTimeline();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load trip';
    } finally {
      loading = false;
    }
  }

  /**
   * Convert a local time to UTC using the provided timezone
   * The database stores times as UTC, but they represent local times in the given timezone
   * To sort correctly, we need to convert them all to UTC for comparison
   */
  function getUTCTime(dateStr: string, timezone: string | undefined): number {
    const date = new Date(dateStr);

    if (!timezone) {
      return date.getTime();
    }

    try {
      // Create a formatter to get the offset for this timezone at this date
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const partMap: Record<string, string> = {};
      parts.forEach(p => {
        if (p.type !== 'literal') partMap[p.type] = p.value;
      });

      // Create a date in UTC with the same values as the timezone date
      const year = parseInt(partMap.year, 10);
      const month = parseInt(partMap.month, 10) - 1;
      const day = parseInt(partMap.day, 10);
      const hour = parseInt(partMap.hour, 10);
      const minute = parseInt(partMap.minute, 10);
      const second = parseInt(partMap.second, 10);

      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
      return utcDate.getTime();
    } catch {
      // If timezone parsing fails, return the original time
      return date.getTime();
    }
  }

  function buildTimeline() {
    if (!tripData) return;

    const allItems: TimelineItem[] = [];

    // Add flights
    if (tripData.flights) {
      tripData.flights.forEach((f: any) => {
        const flightNum = f.flightNumber?.match(/(\d+)$/)?.[1] || '';
        const airlineCode = f.flightNumber?.replace(/\d+$/, '') || '';
        const originCity = getCityName(f.origin);
        const destCity = getCityName(f.destination);

        allItems.push({
          type: 'flight',
          id: f.id,
          time: f.departureDateTime ? new Date(getUTCTime(f.departureDateTime, f.originTimezone)) : new Date(),
          timezone: f.originTimezone,
          data: f,
          display: `${originCity} → ${destCity}`,
          icon: itemIcons.flight,
          color: itemColors.flight
        });
      });
    }

    // Add hotels
    if (tripData.hotels) {
      tripData.hotels.forEach((h: any) => {
        allItems.push({
          type: 'hotel',
          id: h.id,
          time: h.checkInDateTime ? new Date(getUTCTime(h.checkInDateTime, h.checkInTimezone)) : new Date(),
          timezone: h.checkInTimezone,
          data: h,
          display: h.hotelName || 'Hotel',
          icon: itemIcons.hotel,
          color: itemColors.hotel
        });
      });
    }

    // Add transportation
    if (tripData.transportation) {
      tripData.transportation.forEach((t: any) => {
        const originCity = getCityName(t.origin);
        const destCity = getCityName(t.destination);

        allItems.push({
          type: 'transportation',
          id: t.id,
          time: t.departureDateTime ? new Date(getUTCTime(t.departureDateTime, t.timezone)) : new Date(),
          timezone: t.timezone,
          data: t,
          display: `${originCity} → ${destCity}`,
          icon: getTransportationIcon(t.method),
          color: itemColors.transportation
        });
      });
    }

    // Add car rentals
    if (tripData.carRentals) {
      tripData.carRentals.forEach((c: any) => {
        allItems.push({
          type: 'carRental',
          id: c.id,
          time: c.pickupDateTime ? new Date(getUTCTime(c.pickupDateTime, c.timezone)) : new Date(),
          timezone: c.timezone,
          data: c,
          display: c.company || 'Car Rental',
          icon: itemIcons.carRental,
          color: itemColors.carRental
        });
      });
    }

    // Add events
    if (tripData.events) {
      tripData.events.forEach((e: any) => {
        allItems.push({
          type: 'event',
          id: e.id,
          time: e.startDateTime ? new Date(getUTCTime(e.startDateTime, e.startTimezone)) : new Date(),
          timezone: e.startTimezone,
          data: e,
          display: e.name || 'Event',
          icon: itemIcons.event,
          color: itemColors.event
        });
      });
    }

    // Sort by date (now properly accounting for timezones)
    allItems.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Group by date
    const groups: Record<string, TimelineItem[]> = {};
    const dateOrder: string[] = [];

    allItems.forEach(item => {
      const dateStr = item.time.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      if (!groups[dateStr]) {
        groups[dateStr] = [];
        dateOrder.push(dateStr);
      }
      groups[dateStr].push(item);
    });

    dateGroups = dateOrder.map(dateStr => ({
      date: dateStr,
      items: groups[dateStr]
    }));
  }

  onMount(() => {
    loadTrip();
  });
</script>

<div class="trip-timeline px-6 py-6">
  {#if loading}
    <div class="text-center py-8">
      <p class="text-gray-500">Loading items...</p>
    </div>
  {:else if error}
    <div class="text-center py-8 text-red-600">
      <p>{error}</p>
    </div>
  {:else if dateGroups.length === 0}
    <div class="text-center py-12">
      <span class="material-symbols-outlined text-5xl text-gray-300 mb-4 block">calendar_month</span>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
      <p class="text-gray-500">Add flights, hotels, or activities to see them here</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each dateGroups as group (group.date)}
        <div class="border-l-2 border-blue-200 pl-4 ml-2">
          <div class="mb-3 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {formatDate(new Date(group.date.split('-').join('/')))}
          </div>
          <div class="space-y-2">
            {#each group.items as item (item.id)}
              <div
                class="trip-item flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-colors cursor-pointer"
                on:click={() => onItemClick(item.type, item.id)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && onItemClick(item.type, item.id)}
              >
                <!-- Left: Time and Icon -->
                <div class="flex gap-3 flex-1 items-start min-w-0">
                  <div class="flex flex-col items-center gap-1 flex-shrink-0">
                    <span class="text-xs font-medium text-gray-900">
                      {#if item.data.departureDateTime || item.data.checkInDateTime || item.data.pickupDateTime || item.data.startDateTime}
                        {formatTime(item.data.departureDateTime || item.data.checkInDateTime || item.data.pickupDateTime || item.data.startDateTime)}
                      {/if}
                    </span>
                    <span class="material-symbols-outlined text-sm" style="color: {item.color};">
                      {item.icon}
                    </span>
                  </div>

                  <!-- Center: Item details -->
                  <div class="flex-1 min-w-0">
                    {#if item.type === 'flight'}
                      <p class="text-xs font-medium text-gray-900 mb-1">
                        {item.data.flightNumber || ''}
                      </p>
                      <p class="text-base text-gray-600 whitespace-nowrap">
                        {item.display}
                      </p>
                    {:else}
                      <p class="text-base text-gray-600 whitespace-nowrap">
                        {item.display}
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .trip-timeline {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }
</style>
