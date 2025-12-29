<script lang="ts">
  import { onMount } from 'svelte';
  import { tripStore, tripStoreActions } from '$lib/stores/tripStore';
  import { authStore } from '$lib/stores/authStore';
  import { tripsApi } from '$lib/services/api';
  import { formatTimeInTimezone, formatDateTimeInTimezone } from '$lib/utils/timezoneUtils';
  import MapLayout from '$lib/components/MapLayout.svelte';
  import Button from '$lib/components/Button.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import ItemEditForm from '$lib/components/ItemEditForm.svelte';
  import DashboardCalendar from '$lib/components/DashboardCalendar.svelte';
  import SettingsProfile from '$lib/components/SettingsProfile.svelte';
  import SettingsSecurity from '$lib/components/SettingsSecurity.svelte';
  import SettingsVouchers from '$lib/components/SettingsVouchers.svelte';
  import SettingsCompanions from '$lib/components/SettingsCompanions.svelte';
  import SettingsBackup from '$lib/components/SettingsBackup.svelte';
  import VoucherForm from '$lib/components/VoucherForm.svelte';
  import CompanionForm from '$lib/components/CompanionForm.svelte';
  import CompanionIndicators from '$lib/components/CompanionIndicators.svelte';

  let trips: any[] = [];
  let standaloneItems: any = { flights: [], hotels: [], transportation: [], carRentals: [], events: [] };
  let filteredItems: any[] = []; // Mixed trips and standalone items
  let activeTab: 'upcoming' | 'past' = 'upcoming';
  let activeView: 'trips' | 'settings' = 'trips';
  let loading = true;
  let error: string | null = null;
  let expandedTrips = new Set<string>();
  let mapData: any = { flights: [], hotels: [], events: [], transportation: [], carRentals: [] };
  let highlightedTripId: string | null = null;
  let highlightedItemId: string | null = null;
  let highlightedItemType: string | null = null;
  let secondarySidebarContent: { type: string; itemType?: string; data: any } | null = null;
  let tertiarySidebarContent: { type: string; data: any } | null = null;
  let showNewItemMenu = false;
  let groupedItems: Record<string, Array<any>> = {};
  let dateKeysInOrder: string[] = [];

  // Helper function to extract month key (YYYY-MM) using item's timezone
  function getDateKeyForItem(item: any): string {
    let date: Date;
    let timezone: string | null = null;

    if (item.type === 'trip') {
      date = parseLocalDate(item.data.departureDate);
      // Trips use UTC by default (already in YYYY-MM-DD format)
    } else {
      date = item.sortDate;
      // Extract timezone from item based on type
      if (item.itemType === 'flight') {
        timezone = item.data.originTimezone;
      } else if (item.itemType === 'hotel') {
        timezone = item.data.timezone;
      } else if (item.itemType === 'transportation') {
        timezone = item.data.originTimezone;
      } else if (item.itemType === 'carRental') {
        timezone = item.data.pickupTimezone;
      } else if (item.itemType === 'event') {
        timezone = item.data.timezone;
      }
    }

    // Format date in item's timezone if available, otherwise UTC
    if (timezone) {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          timeZone: timezone
        });
        const parts = formatter.formatToParts(date);
        const values: Record<string, string> = {};
        parts.forEach(part => {
          if (part.type !== 'literal') {
            values[part.type] = part.value;
          }
        });
        return `${values.year}-${values.month}`;
      } catch {
        // Fallback to UTC if timezone invalid
      }
    }

    // Fallback: use UTC date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Reactive statement to regroup whenever filteredItems changes
  $: if (filteredItems.length > 0) {
    groupedItems = {};
    dateKeysInOrder = [];

    filteredItems.forEach(item => {
      const dateKey = getDateKeyForItem(item);
      if (!groupedItems[dateKey]) {
        groupedItems[dateKey] = [];
        dateKeysInOrder.push(dateKey);
      }
      groupedItems[dateKey].push(item);
    });
  } else {
    groupedItems = {};
    dateKeysInOrder = [];
  }

  // Manage secondary sidebar full-width class and tertiary presence
  $: if (typeof window !== 'undefined' && secondarySidebarContent) {
    const sidebarEl = document.getElementById('secondary-sidebar');
    if (sidebarEl) {
      // Apply full-width to certain content types
      const shouldBeFullWidth = ['calendar', 'settings-vouchers', 'settings-companions', 'settings-backup'].includes(
        secondarySidebarContent.type
      );

      if (shouldBeFullWidth) {
        sidebarEl.classList.add('full-width');
      } else {
        sidebarEl.classList.remove('full-width');
      }

      // Add with-tertiary class if tertiary sidebar is open (even in full-width mode)
      if (tertiarySidebarContent) {
        sidebarEl.classList.add('with-tertiary');
      } else {
        sidebarEl.classList.remove('with-tertiary');
      }
    }
  }

  async function loadTripData() {
    try {
      const response = await tripsApi.getAll('all');
      const tripsData = response?.trips || [];
      standaloneItems = response?.standalone || { flights: [], hotels: [], transportation: [], carRentals: [], events: [] };

      // Fetch detailed data for each trip
      const detailedTrips = await Promise.all(
        tripsData.map(async (trip) => {
          try {
            return await tripsApi.getOne(trip.id);
          } catch (err) {
            console.error('Error fetching trip details:', err);
            return trip;
          }
        })
      );

      tripStoreActions.setTrips(detailedTrips);
      trips = detailedTrips;
      filterTrips();
      updateMapData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load trips';
      error = errorMsg;
    } finally {
      loading = false;
    }
  }

  function handleDataImported() {
    // Reload trip data after import without full page refresh
    loadTripData();
  }

  function handleAddCompanion() {
    openTertiarySidebar('add-companion', {});
  }

  function handleEditCompanion(event: any) {
    const companion = event.detail?.companion;
    if (companion) {
      openTertiarySidebar('edit-companion', { companion });
    }
  }

  onMount(async () => {
    await loadTripData();

    // Listen for data import events
    window.addEventListener('dataImported', handleDataImported);

    // Listen for companion add/edit events from SettingsCompanions
    window.addEventListener('add-companion', handleAddCompanion);
    window.addEventListener('edit-companion', handleEditCompanion);

    return () => {
      window.removeEventListener('dataImported', handleDataImported);
      window.removeEventListener('add-companion', handleAddCompanion);
      window.removeEventListener('edit-companion', handleEditCompanion);
    };
  });

  function parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  function getTripEndDate(trip: any): Date {
    if (trip.returnDate) {
      return parseLocalDate(trip.returnDate);
    }
    return trip.departureDate ? parseLocalDate(trip.departureDate) : new Date(0);
  }

  function getItemDate(item: any, itemType: string): Date {
    if (itemType === 'flight') return new Date(item.departureDateTime);
    if (itemType === 'hotel') return new Date(item.checkInDateTime);
    if (itemType === 'transportation') return new Date(item.departureDateTime);
    if (itemType === 'carRental') return new Date(item.pickupDateTime);
    if (itemType === 'event') return new Date(item.startDateTime);
    return new Date(0);
  }

  function filterTrips() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allItems: any[] = [];

    // Add trips as items
    trips.forEach((trip) => {
      allItems.push({
        type: 'trip',
        data: trip,
        sortDate: trip.departureDate ? parseLocalDate(trip.departureDate) : new Date(0)
      });
    });

    // Add standalone items
    ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach((key) => {
      const itemTypeMap: Record<string, string> = {
        flights: 'flight',
        hotels: 'hotel',
        transportation: 'transportation',
        carRentals: 'carRental',
        events: 'event'
      };

      if (standaloneItems[key]) {
        standaloneItems[key].forEach((item: any) => {
          allItems.push({
            type: 'standalone',
            itemType: itemTypeMap[key],
            data: item,
            sortDate: getItemDate(item, itemTypeMap[key])
          });
        });
      }
    });

    // Filter by upcoming/past
    if (activeTab === 'upcoming') {
      filteredItems = allItems.filter((item) => {
        if (item.type === 'trip') {
          const tripDate = item.data.departureDate ? parseLocalDate(item.data.departureDate) : null;
          return tripDate && tripDate >= now;
        } else {
          return item.sortDate >= now;
        }
      });
      // Sort chronologically (oldest first)
      filteredItems.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    } else if (activeTab === 'past') {
      filteredItems = allItems.filter((item) => {
        if (item.type === 'trip') {
          const endDate = getTripEndDate(item.data);
          return endDate < now;
        } else {
          return item.sortDate < now;
        }
      });
      // Sort reverse chronologically (most recent first)
      filteredItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    }
  }

  function updateMapData() {
    const combined = {
      flights: [],
      hotels: [],
      events: [],
      transportation: [],
      carRentals: []
    };

    // Add items from trips
    filteredItems.forEach(item => {
      if (item.type === 'trip') {
        const trip = item.data;
        // Ensure each item has tripId attached so map highlighting can filter by trip
        if (trip.flights) combined.flights.push(...trip.flights.map((f: any) => ({ ...f, tripId: trip.id })));
        if (trip.hotels) combined.hotels.push(...trip.hotels.map((h: any) => ({ ...h, tripId: trip.id })));
        if (trip.events) combined.events.push(...trip.events.map((e: any) => ({ ...e, tripId: trip.id })));
        if (trip.transportation) combined.transportation.push(...trip.transportation.map((t: any) => ({ ...t, tripId: trip.id })));
        if (trip.carRentals) combined.carRentals.push(...trip.carRentals.map((c: any) => ({ ...c, tripId: trip.id })));
      } else if (item.type === 'standalone') {
        // Standalone items have no tripId (null)
        if (item.itemType === 'flight') combined.flights.push(item.data);
        else if (item.itemType === 'hotel') combined.hotels.push(item.data);
        else if (item.itemType === 'event') combined.events.push(item.data);
        else if (item.itemType === 'transportation') combined.transportation.push(item.data);
        else if (item.itemType === 'carRental') combined.carRentals.push(item.data);
      }
    });

    mapData = combined;
  }


  function handleTabChange(tab: 'upcoming' | 'past') {
    activeTab = tab;
    closeSecondarySidebar();
    filterTrips();
    updateMapData();
  }

  async function handleDeleteTrip(tripId: string, event: Event) {
    event.stopPropagation();
    try {
      await tripsApi.delete(tripId);
      tripStoreActions.deleteTrip(tripId);
      trips = trips.filter((t) => t.id !== tripId);
      filterTrips();
      updateMapData();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete trip';
    }
  }

  function handleCreateTrip() {
    showNewItemMenu = true;
    secondarySidebarContent = { type: 'newItemMenu', data: {} };
  }

  function handleCalendarClick() {
    secondarySidebarContent = { type: 'calendar', data: {} };
    updateSecondarySidebarClass();
  }

  function updateSecondarySidebarClass() {
    setTimeout(() => {
      const secondarySidebar = document.getElementById('secondary-sidebar');
      if (secondarySidebar) {
        if (secondarySidebarContent?.type === 'calendar') {
          secondarySidebar.classList.add('full-width');
        } else {
          secondarySidebar.classList.remove('full-width');
        }
      }
    }, 0);
  }

  function handleNewTripClick() {
    showNewItemMenu = false;
    secondarySidebarContent = { type: 'trip', itemType: 'trip', data: {} };
  }

  function handleNewItemClick(itemType: string) {
    showNewItemMenu = false;
    secondarySidebarContent = { type: itemType, itemType, data: {} };
  }

  function toggleTripExpanded(tripId: string) {
    if (expandedTrips.has(tripId)) {
      expandedTrips.delete(tripId);
    } else {
      expandedTrips.add(tripId);
    }
    expandedTrips = expandedTrips;
  }

  function handleTripHover(tripId: string) {
    highlightedTripId = tripId;
  }

  function handleTripLeave() {
    highlightedTripId = null;
  }

  function handleItemHover(itemType: string, itemId: string) {
    highlightedItemType = itemType;
    highlightedItemId = itemId;
  }

  function handleItemLeave() {
    highlightedItemId = null;
    highlightedItemType = null;
  }

  function handleItemClick(type: string, itemType: string | null, data: any) {
    secondarySidebarContent = { type, itemType: itemType || undefined, data };
  }

  function closeSecondarySidebar() {
    secondarySidebarContent = null;
    updateSecondarySidebarClass();
  }

  function openTertiarySidebar(type: string, data: any = {}) {
    tertiarySidebarContent = { type, data };
  }

  function closeTertiarySidebar() {
    tertiarySidebarContent = null;
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = parseLocalDate(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function formatMonthHeader(monthKey: string): string {
    if (!monthKey) return '';
    // monthKey is in format YYYY-MM
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[month - 1]} ${year}`;
  }

  function formatTripDateHeader(dateStr: string): string {
    if (!dateStr) return '';
    // dateStr is in format YYYY-MM-DD
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    const date = new Date(year, month, day);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr2 = months[month];

    return `${dayOfWeek}, ${day} ${monthStr2}`;
  }

  // Helper function to extract day key (YYYY-MM-DD) using item's timezone for nested items
  function getDayKeyForItem(item: any): string {
    let date: Date;
    let timezone: string | null = null;

    // For trip items, extract timezone from the item data
    if (item.type === 'flight') {
      date = new Date(item.departureDateTime);
      timezone = item.originTimezone;
    } else if (item.type === 'hotel') {
      date = new Date(item.checkInDateTime);
      timezone = item.timezone;
    } else if (item.type === 'transportation') {
      date = new Date(item.departureDateTime);
      timezone = item.originTimezone;
    } else if (item.type === 'carRental') {
      date = new Date(item.pickupDateTime);
      timezone = item.pickupTimezone;
    } else if (item.type === 'event') {
      date = new Date(item.startDateTime);
      timezone = item.timezone;
    } else {
      return '';
    }

    // Format date in item's timezone if available, otherwise UTC
    if (timezone) {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: timezone
        });
        const parts = formatter.formatToParts(date);
        const values: Record<string, string> = {};
        parts.forEach(part => {
          if (part.type !== 'literal') {
            values[part.type] = part.value;
          }
        });
        return `${values.year}-${values.month}-${values.day}`;
      } catch {
        // Fallback to UTC if timezone invalid
      }
    }

    // Fallback: use UTC date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function to group trip items by date
  function groupTripItemsByDate(trip: any): Record<string, Array<any>> {
    const grouped: Record<string, Array<any>> = {};
    const dateOrder: string[] = [];

    const allItems: any[] = [];

    // Collect all items from the trip
    if (trip.flights) {
      trip.flights.forEach((f: any) => {
        allItems.push({ type: 'flight', ...f });
      });
    }
    if (trip.hotels) {
      trip.hotels.forEach((h: any) => {
        allItems.push({ type: 'hotel', ...h });
      });
    }
    if (trip.transportation) {
      trip.transportation.forEach((t: any) => {
        allItems.push({ type: 'transportation', ...t });
      });
    }
    if (trip.carRentals) {
      trip.carRentals.forEach((c: any) => {
        allItems.push({ type: 'carRental', ...c });
      });
    }
    if (trip.events) {
      trip.events.forEach((e: any) => {
        allItems.push({ type: 'event', ...e });
      });
    }

    // Sort items chronologically
    allItems.sort((a, b) => {
      const dateA = a.type === 'flight' ? new Date(a.departureDateTime) :
                    a.type === 'hotel' ? new Date(a.checkInDateTime) :
                    a.type === 'transportation' ? new Date(a.departureDateTime) :
                    a.type === 'carRental' ? new Date(a.pickupDateTime) :
                    a.type === 'event' ? new Date(a.startDateTime) : new Date(0);
      const dateB = b.type === 'flight' ? new Date(b.departureDateTime) :
                    b.type === 'hotel' ? new Date(b.checkInDateTime) :
                    b.type === 'transportation' ? new Date(b.departureDateTime) :
                    b.type === 'carRental' ? new Date(b.pickupDateTime) :
                    b.type === 'event' ? new Date(b.startDateTime) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

    // Group by date
    allItems.forEach(item => {
      const dateKey = getDayKeyForItem(item);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
        dateOrder.push(dateKey);
      }
      grouped[dateKey].push(item);
    });

    return grouped;
  }

  function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function formatTimeOnly(dateStr: string, timezone: string | null = null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);

    if (!timezone) {
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // With timezone conversion
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(date);
  }

  function formatDateTime(dateStr: string, timezone: string | null = null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);

    // If no timezone, use UTC time (for events/hotels that don't have timezone)
    if (!timezone) {
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    }

    // Use timezone-aware formatting
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      });

      // Format and rearrange to "DD Mon YYYY HH:mm"
      const parts = formatter.formatToParts(date);
      const values: Record<string, string> = {};
      parts.forEach(part => {
        if (part.type !== 'literal') {
          values[part.type] = part.value;
        }
      });

      return `${values.day} ${values.month} ${values.year} ${values.hour}:${values.minute}`;
    } catch (error) {
      // Fallback to UTC time if timezone is invalid
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    }
  }

  function formatDateOnly(dateStr: string, timezone: string | null = null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);

    // If no timezone, use UTC time (for hotels/events that don't have timezone)
    if (!timezone) {
      const day = String(date.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year}`;
    }

    // Use timezone-aware formatting
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: timezone
      });

      // Format and rearrange to "DD Mon YYYY"
      const parts = formatter.formatToParts(date);
      const values: Record<string, string> = {};
      parts.forEach(part => {
        if (part.type !== 'literal') {
          values[part.type] = part.value;
        }
      });

      return `${values.day} ${values.month} ${values.year}`;
    } catch (error) {
      // Fallback to UTC time if timezone is invalid
      const day = String(date.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year}`;
    }
  }

  function getCityName(location: string): string {
    if (!location) return '';

    // Handle format: "CODE - City, State, Country"
    if (location.includes(' - ')) {
      const parts = location.split(' - ')[1];
      if (parts && parts.includes(',')) {
        // Extract just the city name (first part before comma)
        return parts.split(',')[0].trim();
      }
      return parts?.trim() || '';
    }

    // Handle format: "City, State, Country"
    if (location.includes(',')) {
      return location.split(',')[0].trim();
    }

    // Return as-is if no recognizable format
    return location.trim();
  }

  function getTransportIcon(method: string): string {
    const methodLower = (method || '').toLowerCase().trim();
    const iconMap: Record<string, string> = {
      'train': 'train',
      'bus': 'directions_bus',
      'ferry': 'directions_boat',
      'shuttle': 'local_taxi',
      'taxi': 'local_taxi',
      'rideshare': 'local_taxi',
      'subway': 'subway',
      'metro': 'subway',
      'tram': 'tram',
      'other': 'directions_run'
    };
    return iconMap[methodLower] || 'train';
  }

  function getTransportColor(method: string): string {
    const methodLower = (method || '').toLowerCase().trim();
    const colorMap: Record<string, string> = {
      'train': 'blue',
      'bus': 'amber',
      'ferry': 'cyan',
      'shuttle': 'purple',
      'taxi': 'orange',
      'rideshare': 'orange',
      'subway': 'teal',
      'metro': 'teal',
      'tram': 'emerald',
      'other': 'gray'
    };
    return colorMap[methodLower] || 'amber';
  }

  function getTripIcon(purpose: string): string {
    if (purpose === 'business') return 'badge';
    if (['leisure', 'family', 'romantic'].includes(purpose)) return 'hotel';
    return 'flights_and_hotels';
  }

  function getTripCities(trip: any): string {
    const cities = new Set<string>();

    if (trip.flights) {
      trip.flights.forEach((f: any) => {
        if (f.origin) cities.add(getCityName(f.origin));
        if (f.destination) cities.add(getCityName(f.destination));
      });
    }

    if (trip.transportation) {
      trip.transportation.forEach((t: any) => {
        if (t.origin) cities.add(getCityName(t.origin));
        if (t.destination) cities.add(getCityName(t.destination));
      });
    }

    if (trip.carRentals) {
      trip.carRentals.forEach((c: any) => {
        if (c.pickupLocation) cities.add(getCityName(c.pickupLocation));
      });
    }

    return Array.from(cities).sort().join(', ');
  }

  function calculateLayover(flight1: any, flight2: any): { duration: string; location: string } | null {
    // Check if both are flights
    if (flight1.type !== 'flight' || flight2.type !== 'flight') {
      return null;
    }

    // Check if arrival airport matches departure airport
    const arrivalAirportCode = flight1.destination?.split(' - ')[0]?.trim();
    const departureAirportCode = flight2.origin?.split(' - ')[0]?.trim();

    if (!arrivalAirportCode || !departureAirportCode || arrivalAirportCode !== departureAirportCode) {
      return null;
    }

    // Get arrival time of first flight and departure time of second flight
    const arrivalTime = new Date(flight1.arrivalDateTime);
    const departureTime = new Date(flight2.departureDateTime);

    // Calculate difference in milliseconds
    const durationMs = departureTime.getTime() - arrivalTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Only show layover if less than 24 hours
    if (durationHours < 0 || durationHours >= 24) {
      return null;
    }

    // Convert to hours and minutes
    const hours = Math.floor(durationHours);
    const minutes = Math.round((durationHours - hours) * 60);

    // Format as "Xh Ym in AIRPORT"
    const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    const location = arrivalAirportCode;

    return {
      duration: durationStr,
      location
    };
  }

  function getFlightLayoverInfo(trip: any, flightId: string): { duration: string; location: string } | null {
    const allItems: any[] = [];

    // Collect all items from the trip and sort chronologically
    if (trip.flights) {
      trip.flights.forEach((f: any) => {
        allItems.push({ type: 'flight', ...f });
      });
    }
    if (trip.hotels) {
      trip.hotels.forEach((h: any) => {
        allItems.push({ type: 'hotel', ...h });
      });
    }
    if (trip.transportation) {
      trip.transportation.forEach((t: any) => {
        allItems.push({ type: 'transportation', ...t });
      });
    }
    if (trip.carRentals) {
      trip.carRentals.forEach((c: any) => {
        allItems.push({ type: 'carRental', ...c });
      });
    }
    if (trip.events) {
      trip.events.forEach((e: any) => {
        allItems.push({ type: 'event', ...e });
      });
    }

    // Sort items chronologically
    allItems.sort((a, b) => {
      const dateA = a.type === 'flight' ? new Date(a.departureDateTime) :
                    a.type === 'hotel' ? new Date(a.checkInDateTime) :
                    a.type === 'transportation' ? new Date(a.departureDateTime) :
                    a.type === 'carRental' ? new Date(a.pickupDateTime) :
                    a.type === 'event' ? new Date(a.startDateTime) : new Date(0);
      const dateB = b.type === 'flight' ? new Date(b.departureDateTime) :
                    b.type === 'hotel' ? new Date(b.checkInDateTime) :
                    b.type === 'transportation' ? new Date(b.departureDateTime) :
                    b.type === 'carRental' ? new Date(b.pickupDateTime) :
                    b.type === 'event' ? new Date(b.startDateTime) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

    // Find the flight and check the next flight
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].type === 'flight' && allItems[i].id === flightId) {
        // Check if there's a next item that's a flight
        if (i + 1 < allItems.length && allItems[i + 1].type === 'flight') {
          return calculateLayover(allItems[i], allItems[i + 1]);
        }
        break;
      }
    }

    return null;
  }

  function layoverSpansDates(trip: any, flightId: string, currentDayKey: string): boolean {
    const allItems: any[] = [];

    // Collect all items from the trip and sort chronologically
    if (trip.flights) {
      trip.flights.forEach((f: any) => {
        allItems.push({ type: 'flight', ...f });
      });
    }
    if (trip.hotels) {
      trip.hotels.forEach((h: any) => {
        allItems.push({ type: 'hotel', ...h });
      });
    }
    if (trip.transportation) {
      trip.transportation.forEach((t: any) => {
        allItems.push({ type: 'transportation', ...t });
      });
    }
    if (trip.carRentals) {
      trip.carRentals.forEach((c: any) => {
        allItems.push({ type: 'carRental', ...c });
      });
    }
    if (trip.events) {
      trip.events.forEach((e: any) => {
        allItems.push({ type: 'event', ...e });
      });
    }

    // Sort items chronologically
    allItems.sort((a, b) => {
      const dateA = a.type === 'flight' ? new Date(a.departureDateTime) :
                    a.type === 'hotel' ? new Date(a.checkInDateTime) :
                    a.type === 'transportation' ? new Date(a.departureDateTime) :
                    a.type === 'carRental' ? new Date(a.pickupDateTime) :
                    a.type === 'event' ? new Date(a.startDateTime) : new Date(0);
      const dateB = b.type === 'flight' ? new Date(b.departureDateTime) :
                    b.type === 'hotel' ? new Date(b.checkInDateTime) :
                    b.type === 'transportation' ? new Date(b.departureDateTime) :
                    b.type === 'carRental' ? new Date(b.pickupDateTime) :
                    b.type === 'event' ? new Date(b.startDateTime) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

    // Find the flight and check if next flight is on a different date
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].type === 'flight' && allItems[i].id === flightId) {
        if (i + 1 < allItems.length && allItems[i + 1].type === 'flight') {
          const nextDayKey = getDayKeyForItem(allItems[i + 1]);
          return nextDayKey !== currentDayKey;
        }
        break;
      }
    }

    return false;
  }
</script>

<svelte:head>
  <title>Dashboard - Bluebonnet</title>
</svelte:head>

<MapLayout tripData={mapData} isPast={activeTab === 'past'} {highlightedTripId} highlightedItemType={highlightedItemType} highlightedItemId={highlightedItemId}>
  <div slot="primary" class="primary-content">
    <div class="header-section">
      <div class="header-top">
        <h1>My Trips</h1>
        <div class="header-buttons">
          <button class="icon-btn" title="View calendar" on:click={handleCalendarClick}>
            <span class="material-symbols-outlined">calendar_month</span>
          </button>
          <button class="add-btn" title="Add new trip" on:click={handleCreateTrip}>
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      {#if error}
        <Alert type="error" message={error} dismissible />
      {/if}

      <nav class="tabs">
        <div class="tabs-left">
          <button
            class="tab-btn"
            class:active={activeView === 'trips' && activeTab === 'upcoming'}
            on:click={() => {
              activeView = 'trips';
              handleTabChange('upcoming');
            }}
          >
            Upcoming
          </button>
          <button
            class="tab-btn"
            class:active={activeView === 'trips' && activeTab === 'past'}
            on:click={() => {
              activeView = 'trips';
              handleTabChange('past');
            }}
          >
            Past
          </button>
        </div>
        <button
          class="tab-btn settings-btn"
          class:active={activeView === 'settings'}
          title="Settings"
          on:click={() => activeView = 'settings'}
        >
          <span class="material-symbols-outlined" style="font-size: 1.1rem;">settings</span>
        </button>
      </nav>
    </div>

    <div class="trips-content">
      {#if activeView === 'settings'}
        <!-- Settings View -->
        <div class="settings-main-panel">
          <div class="settings-main-content">
            <div class="settings-section">
              <h3>Account</h3>
              <button class="settings-item" on:click={() => {
                secondarySidebarContent = { type: 'settings-profile', data: $authStore.user || {} };
              }}>
                <span class="material-symbols-outlined">person</span>
                <span>Profile</span>
              </button>
              <button class="settings-item" on:click={() => {
                secondarySidebarContent = { type: 'settings-security', data: {} };
              }}>
                <span class="material-symbols-outlined">lock</span>
                <span>Security</span>
              </button>
            </div>
            <div class="settings-section">
              <h3>Manage Vouchers & Credits</h3>
              <button class="settings-item" on:click={() => {
                secondarySidebarContent = { type: 'settings-vouchers', data: {} };
              }}>
                <span class="material-symbols-outlined">card_giftcard</span>
                <span>Vouchers & Credits</span>
              </button>
            </div>
            <div class="settings-section">
              <h3>Manage Travel Companions</h3>
              <button class="settings-item" on:click={() => {
                secondarySidebarContent = { type: 'settings-companions', data: {} };
              }}>
                <span class="material-symbols-outlined">people</span>
                <span>Travel Companions</span>
              </button>
            </div>
            <div class="settings-section">
              <h3>Data</h3>
              <button class="settings-item" on:click={() => {
                secondarySidebarContent = { type: 'settings-backup', data: {} };
              }}>
                <span class="material-symbols-outlined">cloud_download</span>
                <span>Backup & Export</span>
              </button>
            </div>
            <div class="settings-section">
              <h3>Account Actions</h3>
              <a href="/logout" class="settings-item logout">
                <span class="material-symbols-outlined">logout</span>
                <span>Sign Out</span>
              </a>
            </div>
          </div>
        </div>
      {:else if loading}
        <Loading message="Loading trips..." />
      {:else if filteredItems.length === 0}
        <div class="empty-state">
          <span class="material-symbols-outlined empty-icon">calendar_month</span>
          <p>
            {activeTab === 'upcoming'
              ? 'No upcoming trips'
              : 'No past trips'}
          </p>
          <Button variant="primary" size="small" on:click={handleCreateTrip}>
            Create Trip
          </Button>
        </div>
      {:else}
        <div class="trips-list">
          {#each dateKeysInOrder as dateKey (dateKey)}
            <div class="timeline-date-group">
              <div class="timeline-date-header">
                <span class="date-badge">{formatMonthHeader(dateKey)}</span>
              </div>
              <div class="timeline-items">
                {#each groupedItems[dateKey] as item (item.type === 'trip' ? item.data.id : `${item.itemType}-${item.data.id}`)}
                  {#if item.type === 'trip'}
            <div
              class="trip-card"
              class:expanded={expandedTrips.has(item.data.id)}
              class:highlighted={highlightedTripId === item.data.id}
              on:mouseenter={() => handleTripHover(item.data.id)}
              on:mouseleave={() => handleTripLeave()}
            >
              <!-- Trip Header -->
              <div
                class="trip-header"
                on:click={() => toggleTripExpanded(item.data.id)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && toggleTripExpanded(item.data.id)}
              >
                <div class="trip-icon-container">
                  <span class="material-symbols-outlined trip-icon">
                    {getTripIcon(item.data.purpose)}
                  </span>
                </div>

                <div class="trip-info">
                  <div class="trip-name-row">
                    <h3 class="trip-name">{item.data.name}</h3>
                    <button
                      class="edit-btn"
                      title="Edit trip details and companions"
                      on:click={(e) => {
                        e.stopPropagation();
                        secondarySidebarContent = { type: 'item', itemType: 'trip', data: item.data };
                      }}
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

                {#if item.data.travelCompanions && item.data.travelCompanions.length > 0}
                  <div class="trip-companions">
                    <CompanionIndicators companions={item.data.travelCompanions} />
                  </div>
                {/if}

                <button
                  class="expand-btn"
                  class:rotated={expandedTrips.has(item.data.id)}
                  on:click={(e) => {
                    e.stopPropagation();
                    toggleTripExpanded(item.data.id);
                  }}
                >
                  <span class="material-symbols-outlined">expand_more</span>
                </button>
              </div>

              <!-- Trip Items (Accordion Content) - Date-level Timeline -->
              {#if expandedTrips.has(item.data.id)}
                <div class="trip-items">
                  {#each Object.keys(groupTripItemsByDate(item.data)) as dayKey (dayKey)}
                    <div class="trip-item-date-group">
                      <div class="trip-item-date-header">
                        <span class="trip-date-badge">{formatTripDateHeader(dayKey)}</span>
                        <div class="date-header-layovers">
                          {#if dayKey === Object.keys(groupTripItemsByDate(item.data))[0]}
                            <!-- Check first day for layover indicators that span to it -->
                            {@const dayKeys = Object.keys(groupTripItemsByDate(item.data))}
                            {#if dayKeys.length > 1}
                              {@const prevDayKey = dayKeys[dayKeys.indexOf(dayKey) - 1]}
                              {#if prevDayKey}
                                {@const prevDayItems = groupTripItemsByDate(item.data)[prevDayKey]}
                                {#each prevDayItems as prevItem}
                                  {#if prevItem.type === 'flight'}
                                    {@const layover = getFlightLayoverInfo(item.data, prevItem.id)}
                                    {@const spansDate = layoverSpansDates(item.data, prevItem.id, prevDayKey)}
                                    {#if layover && spansDate}
                                      <span class="date-header-layover">{layover.duration} in {layover.location}</span>
                                    {/if}
                                  {/if}
                                {/each}
                              {/if}
                            {/if}
                          {:else}
                            <!-- Check previous day for layover indicators that span to this day -->
                            {@const dayKeys = Object.keys(groupTripItemsByDate(item.data))}
                            {@const currentIndex = dayKeys.indexOf(dayKey)}
                            {#if currentIndex > 0}
                              {@const prevDayKey = dayKeys[currentIndex - 1]}
                              {@const prevDayItems = groupTripItemsByDate(item.data)[prevDayKey]}
                              {#each prevDayItems as prevItem}
                                {#if prevItem.type === 'flight'}
                                  {@const layover = getFlightLayoverInfo(item.data, prevItem.id)}
                                  {@const spansDate = layoverSpansDates(item.data, prevItem.id, prevDayKey)}
                                  {#if layover && spansDate}
                                    <span class="date-header-layover">{layover.duration} in {layover.location}</span>
                                  {/if}
                                {/if}
                              {/each}
                            {/if}
                          {/if}
                        </div>
                      </div>
                      <div class="trip-item-date-items">
                        {#each groupTripItemsByDate(item.data)[dayKey] as tripItem (tripItem.id)}
                          {#if tripItem.type === 'flight'}
                            <div
                              class="standalone-item-card"
                              class:item-highlighted={highlightedItemId === tripItem.id && highlightedItemType === 'flight'}
                              on:mouseenter={() => handleItemHover('flight', tripItem.id)}
                              on:mouseleave={handleItemLeave}
                              on:click={() => handleItemClick('flight', 'flight', tripItem)}
                              role="button"
                              tabindex="0"
                              on:keydown={(e) => e.key === 'Enter' && handleItemClick('flight', 'flight', tripItem)}
                            >
                              <div class="flight-icon-wrapper">
                                <p class="flight-time-label">{formatTimeOnly(tripItem.departureDateTime, tripItem.originTimezone)}</p>
                                <div class="item-icon blue">
                                  <span class="material-symbols-outlined" style="font-size: 1.3rem;">flight</span>
                                </div>
                              </div>
                              <div class="item-content">
                                <p class="item-title">{tripItem.flightNumber}</p>
                                <p class="item-route">
                                  {getCityName(tripItem.origin)} → {getCityName(tripItem.destination)}
                                </p>
                              </div>
                            </div>
                            {@const layover = getFlightLayoverInfo(item.data, tripItem.id)}
                            {@const spansDate = layoverSpansDates(item.data, tripItem.id, dayKey)}
                            {#if layover && !spansDate}
                              <div class="layover-indicator">
                                <p class="layover-text">{layover.duration} in {layover.location}</p>
                              </div>
                            {/if}
                          {:else if tripItem.type === 'hotel'}
                            <div
                              class="standalone-item-card"
                              class:item-highlighted={highlightedItemId === tripItem.id && highlightedItemType === 'hotel'}
                              on:mouseenter={() => handleItemHover('hotel', tripItem.id)}
                              on:mouseleave={handleItemLeave}
                              on:click={() => handleItemClick('hotel', 'hotel', tripItem)}
                              role="button"
                              tabindex="0"
                              on:keydown={(e) => e.key === 'Enter' && handleItemClick('hotel', 'hotel', tripItem)}
                            >
                              <div class="item-icon green">
                                <span class="material-symbols-outlined" style="font-size: 1.3rem;">hotel</span>
                              </div>
                              <div class="item-content">
                                <p class="item-title">{tripItem.hotelName || tripItem.name}</p>
                                <p class="item-dates">{formatDateOnly(tripItem.checkInDateTime, tripItem.timezone)} - {formatDateOnly(tripItem.checkOutDateTime, tripItem.timezone)}</p>
                                <p class="item-route">{getCityName(tripItem.address) ? getCityName(tripItem.address) : getCityName(tripItem.city)}</p>
                              </div>
                            </div>
                          {:else if tripItem.type === 'transportation'}
                            <div class="standalone-item-card" on:click={() => handleItemClick('transportation', 'transportation', tripItem)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && handleItemClick('transportation', 'transportation', tripItem)}>
                              <div class="flight-icon-wrapper">
                                <p class="flight-time-label">{formatTimeOnly(tripItem.departureDateTime, tripItem.originTimezone)}</p>
                                <div class="item-icon red">
                                  <span class="material-symbols-outlined" style="font-size: 1.3rem;">{getTransportIcon(tripItem.method)}</span>
                                </div>
                              </div>
                              <div class="item-content">
                                <p class="item-title">{capitalize(tripItem.method)}</p>
                                <p class="item-route">
                                  {getCityName(tripItem.origin)} → {getCityName(tripItem.destination)}
                                </p>
                              </div>
                            </div>
                          {:else if tripItem.type === 'carRental'}
                            <div class="standalone-item-card" on:click={() => handleItemClick('carRental', 'carRental', tripItem)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && handleItemClick('carRental', 'carRental', tripItem)}>
                              <div class="item-icon gray">
                                <span class="material-symbols-outlined" style="font-size: 1.3rem;">directions_car</span>
                              </div>
                              <div class="item-content">
                                <p class="item-title">{tripItem.company}</p>
                                <p class="item-time">{formatDateTime(tripItem.pickupDateTime, tripItem.pickupTimezone)}</p>
                                <p class="item-route">{getCityName(tripItem.pickupLocation)}</p>
                              </div>
                            </div>
                          {:else if tripItem.type === 'event'}
                            <div class="standalone-item-card" on:click={() => handleItemClick('event', 'event', tripItem)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && handleItemClick('event', 'event', tripItem)}>
                              {#if tripItem.isAllDay}
                                <div class="item-icon purple">
                                  <span class="material-symbols-outlined" style="font-size: 1.3rem;">event</span>
                                </div>
                              {:else}
                                <div class="flight-icon-wrapper">
                                  <p class="flight-time-label">{formatTimeOnly(tripItem.startDateTime, tripItem.timezone)}</p>
                                  <div class="item-icon purple">
                                    <span class="material-symbols-outlined" style="font-size: 1.3rem;">event</span>
                                  </div>
                                </div>
                              {/if}
                              <div class="item-content">
                                <p class="item-title">{tripItem.name}</p>
                                <p class="item-time">{formatDateTime(tripItem.startDateTime, tripItem.timezone)}</p>
                                <p class="item-route">{tripItem.location}</p>
                              </div>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}

            </div>
            {:else}
            <!-- Standalone Item Card -->
            <div class="standalone-item-card" on:click={() => handleItemClick(item.itemType, item.itemType, item.data)} on:mouseenter={() => handleItemHover(item.itemType, item.data.id)} on:mouseleave={handleItemLeave} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && handleItemClick(item.itemType, item.itemType, item.data)}>
              <div class="item-icon {item.itemType === 'flight' ? 'blue' : item.itemType === 'hotel' ? 'green' : item.itemType === 'carRental' ? 'gray' : item.itemType === 'event' ? 'purple' : 'red'}">
                <span class="material-symbols-outlined">
                  {item.itemType === 'flight' ? 'flight' : item.itemType === 'hotel' ? 'hotel' : item.itemType === 'carRental' ? 'directions_car' : item.itemType === 'event' ? 'event' : getTransportIcon(item.data.method)}
                </span>
              </div>
              <div class="item-content">
                <p class="item-title">
                  {item.itemType === 'flight' ? item.data.flightNumber : item.itemType === 'hotel' ? (item.data.hotelName || item.data.name) : item.itemType === 'carRental' ? item.data.company : item.itemType === 'event' ? item.data.name : item.data.method}
                </p>
                {#if item.itemType === 'hotel'}
                  <p class="item-dates">{formatDateOnly(item.data.checkInDateTime, item.data.timezone)} - {formatDateOnly(item.data.checkOutDateTime, item.data.timezone)}</p>
                {:else}
                  <p class="item-time">
                    {#if item.itemType === 'flight'}
                      {formatDateTime(item.data.departureDateTime, item.data.originTimezone)}
                    {:else if item.itemType === 'transportation'}
                      {formatDateTime(item.data.departureDateTime, item.data.originTimezone)}
                    {:else if item.itemType === 'carRental'}
                      {formatDateTime(item.data.pickupDateTime, item.data.pickupTimezone)}
                    {:else if item.itemType === 'event'}
                      {formatDateTime(item.data.startDateTime, item.data.timezone)}
                    {/if}
                  </p>
                {/if}
                <p class="item-route">
                  {#if item.itemType === 'flight'}
                    {getCityName(item.data.origin)} → {getCityName(item.data.destination)}
                  {:else if item.itemType === 'hotel'}
                    {getCityName(item.data.address)}
                  {:else if item.itemType === 'transportation'}
                    {getCityName(item.data.origin)} → {getCityName(item.data.destination)}
                  {:else if item.itemType === 'carRental'}
                    {getCityName(item.data.pickupLocation)}
                  {:else if item.itemType === 'event'}
                    {item.data.location}
                  {/if}
                </p>
              </div>
            </div>
            {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

    <div
      slot="secondary"
      class="secondary-content"
      class:full-width={secondarySidebarContent?.type === 'calendar' || secondarySidebarContent?.type === 'settings-vouchers' || secondarySidebarContent?.type === 'settings-companions' || secondarySidebarContent?.type === 'settings-backup'}
    >
      {#if secondarySidebarContent?.type === 'calendar'}
        <!-- Calendar View - Full Width Sidebar -->
        <div class="calendar-sidebar-container">
          <div class="calendar-sidebar-header">
            <h2>Calendar</h2>
            <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <DashboardCalendar
            {trips}
            {standaloneItems}
            onItemClick={handleItemClick}
          />
        </div>
      {:else if secondarySidebarContent?.type === 'settings-profile'}
        <div class="settings-panel">
          <div class="settings-panel-header">
            <h2>Profile</h2>
            <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="settings-panel-content">
            <SettingsProfile data={secondarySidebarContent?.data} />
          </div>
        </div>
      {:else if secondarySidebarContent?.type === 'settings-security'}
        <div class="settings-panel">
          <div class="settings-panel-header">
            <h2>Security</h2>
            <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="settings-panel-content">
            <SettingsSecurity />
          </div>
        </div>
      {:else if secondarySidebarContent?.type === 'settings-vouchers'}
        <div class="calendar-sidebar-container">
          <div class="calendar-sidebar-header">
            <h2>Vouchers & Credits</h2>
            <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <SettingsVouchers
            onEditVoucher={(voucher) => openTertiarySidebar('edit-voucher', { voucher })}
            onAddVoucher={() => openTertiarySidebar('add-voucher', {})}
          />
        </div>
      {:else if secondarySidebarContent?.type === 'settings-companions'}
        <div class="calendar-sidebar-container">
          <div class="calendar-sidebar-header">
            <h2>Travel Companions</h2>
            <div class="header-actions">
              <button class="add-companion-btn" on:click={() => openTertiarySidebar('add-companion', {})} title="Add Companion">
                <span class="material-symbols-outlined">group_add</span>
              </button>
              <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
          <SettingsCompanions />
        </div>
      {:else if secondarySidebarContent?.type === 'settings-backup'}
        <div class="calendar-sidebar-container">
          <div class="calendar-sidebar-header">
            <h2>Backup & Export</h2>
            <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <SettingsBackup />
        </div>
      {:else if secondarySidebarContent?.type === 'newItemMenu'}
      <!-- New Item Menu -->
      <div class="new-item-menu">
        <div class="menu-header">
          <h2 class="menu-title">Add New Item</h2>
          <button class="close-menu-btn" on:click={closeSecondarySidebar} title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="menu-items">
          <!-- Add Trip Option -->
          <button class="menu-item" on:click={handleNewTripClick}>
            <div class="menu-item-icon amber">
              <span class="material-symbols-outlined">flight</span>
            </div>
            <div class="menu-item-content">
              <h3>Trip</h3>
              <p>Plan a complete trip with dates</p>
            </div>
            <span class="material-symbols-outlined menu-arrow">chevron_right</span>
          </button>

          <!-- Divider -->
          <div class="menu-divider">
            <span>or add a single item</span>
          </div>

          <!-- Add Flight Option -->
          <button class="menu-item" on:click={() => handleNewItemClick('flight')}>
            <div class="menu-item-icon blue">
              <span class="material-symbols-outlined">flight</span>
            </div>
            <div class="menu-item-content">
              <h3>Flight</h3>
              <p>Add a flight booking</p>
            </div>
            <span class="material-symbols-outlined menu-arrow">chevron_right</span>
          </button>

          <!-- Add Hotel Option -->
          <button class="menu-item" on:click={() => handleNewItemClick('hotel')}>
            <div class="menu-item-icon green">
              <span class="material-symbols-outlined">hotel</span>
            </div>
            <div class="menu-item-content">
              <h3>Hotel</h3>
              <p>Add a hotel or accommodation</p>
            </div>
            <span class="material-symbols-outlined menu-arrow">chevron_right</span>
          </button>

          <!-- Add Transportation Option -->
          <button class="menu-item" on:click={() => handleNewItemClick('transportation')}>
            <div class="menu-item-icon red">
              <span class="material-symbols-outlined">train</span>
            </div>
            <div class="menu-item-content">
              <h3>Transportation</h3>
              <p>Train, bus, taxi, or other transit</p>
            </div>
            <span class="material-symbols-outlined menu-arrow">chevron_right</span>
          </button>

          <!-- Add Car Rental Option -->
          <button class="menu-item" on:click={() => handleNewItemClick('carRental')}>
            <div class="menu-item-icon gray">
              <span class="material-symbols-outlined">directions_car</span>
            </div>
            <div class="menu-item-content">
              <h3>Car Rental</h3>
              <p>Add a car rental booking</p>
            </div>
            <span class="material-symbols-outlined menu-arrow">chevron_right</span>
          </button>

          <!-- Add Event Option -->
          <button class="menu-item" on:click={() => handleNewItemClick('event')}>
            <div class="menu-item-icon purple">
              <span class="material-symbols-outlined">event</span>
            </div>
            <div class="menu-item-content">
              <h3>Event</h3>
              <p>Concert, conference, or activity</p>
            </div>
            <span class="material-symbols-outlined menu-arrow">chevron_right</span>
          </button>
        </div>
      </div>
    {:else if secondarySidebarContent}
      <ItemEditForm
        itemType={secondarySidebarContent.itemType || secondarySidebarContent.type}
        data={secondarySidebarContent.data}
        tripId={secondarySidebarContent.data?.tripId || ''}
        allTrips={trips}
        onClose={closeSecondarySidebar}
        onSave={async (item) => {
          if (!secondarySidebarContent) return;

          if (item === null) {
            // Item was deleted - remove from list
            if (secondarySidebarContent.type === 'trip') {
              trips = trips.filter(t => t.id !== secondarySidebarContent.data.id);
            } else {
              const key = secondarySidebarContent.itemType + 's';
              if (standaloneItems[key]) {
                standaloneItems[key] = standaloneItems[key].filter(i => i.id !== secondarySidebarContent.data.id);
              }
            }
          } else {
            // Item was saved - add or update in list
            if (secondarySidebarContent.type === 'trip') {
              const idx = trips.findIndex(t => t.id === item.id);
              if (idx >= 0) {
                trips[idx] = item;
                trips = trips;  // Trigger reactivity
              } else {
                // New trip - add to list
                trips = [...trips, item];
              }
            } else {
              // For non-trip items, check if trip assignment changed
              const oldTripId = secondarySidebarContent.data?.tripId;
              const newTripId = item.tripId;
              const itemKey = secondarySidebarContent.itemType + 's';

              if (oldTripId !== newTripId) {
                // Trip assignment changed - need to refetch affected trips
                const tripIds = new Set<string>();
                if (oldTripId) tripIds.add(oldTripId);
                if (newTripId) tripIds.add(newTripId);

                // Refetch the affected trips
                for (const tripId of tripIds) {
                  try {
                    const updatedTrip = await tripsApi.getOne(tripId);
                    const tripIdx = trips.findIndex(t => t.id === tripId);
                    if (tripIdx >= 0) {
                      trips[tripIdx] = updatedTrip;
                    }
                  } catch (err) {
                    console.error('Error refetching trip:', err);
                  }
                }
                // Trigger reactivity after all updates
                trips = trips;

                // If item moved from standalone to trip, remove from standaloneItems
                if (!oldTripId && newTripId && standaloneItems[itemKey]) {
                  standaloneItems[itemKey] = standaloneItems[itemKey].filter(i => i.id !== item.id);
                }
                // If item moved from trip to standalone, add to standaloneItems
                if (oldTripId && !newTripId) {
                  if (standaloneItems[itemKey]) {
                    standaloneItems[itemKey] = [...standaloneItems[itemKey], item];
                  } else {
                    standaloneItems[itemKey] = [item];
                  }
                }
              } else {
                // Trip assignment didn't change - just update locally
                if (newTripId) {
                  // Item is part of a trip - update the trip's items array
                  const tripIdx = trips.findIndex(t => t.id === newTripId);
                  if (tripIdx >= 0) {
                    const trip = trips[tripIdx];
                    if (trip[itemKey]) {
                      const itemIdx = trip[itemKey].findIndex((i: any) => i.id === item.id);
                      if (itemIdx >= 0) {
                        trip[itemKey][itemIdx] = item;
                      }
                    }
                    // Trigger reactivity
                    trips[tripIdx] = trip;
                    trips = trips;
                  }
                } else {
                  // Item is standalone - update standaloneItems
                  if (standaloneItems[itemKey]) {
                    const idx = standaloneItems[itemKey].findIndex((i: any) => i.id === item.id);
                    if (idx >= 0) {
                      standaloneItems[itemKey][idx] = item;
                      standaloneItems[itemKey] = standaloneItems[itemKey];  // Trigger reactivity
                    } else {
                      // New standalone item - add to list
                      standaloneItems[itemKey] = [...standaloneItems[itemKey], item];
                    }
                  } else {
                    // Initialize the array if it doesn't exist
                    standaloneItems[itemKey] = [item];
                  }
                }
              }
            }
          }
          filterTrips();
          updateMapData();
        }}
      />
      {/if}
    </div>

  <div slot="tertiary" class="tertiary-content">
    {#if tertiarySidebarContent?.type === 'edit-voucher'}
      <div class="tertiary-header">
        <h3>Edit Voucher</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <VoucherForm
          tripId=""
          voucherId={tertiarySidebarContent.data?.voucher?.id}
          voucher={tertiarySidebarContent.data?.voucher}
          onSuccess={(voucher) => {
            closeTertiarySidebar();
          }}
          onCancel={closeTertiarySidebar}
        />
      </div>
    {:else if tertiarySidebarContent?.type === 'add-voucher'}
      <div class="tertiary-header">
        <h3>Add Voucher</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <VoucherForm
          tripId=""
          voucherId={null}
          voucher={null}
          onSuccess={(voucher) => {
            closeTertiarySidebar();
          }}
          onCancel={closeTertiarySidebar}
        />
      </div>
    {:else if tertiarySidebarContent?.type === 'add-companion'}
      <div class="tertiary-header">
        <h3>Add Companion</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <CompanionForm
          companion={null}
          onSuccess={(companion) => {
            closeTertiarySidebar();
            // Dispatch event to refresh companions list
            window.dispatchEvent(new CustomEvent('companions-updated', { detail: { companion } }));
          }}
          onCancel={closeTertiarySidebar}
        />
      </div>
    {:else if tertiarySidebarContent?.type === 'edit-companion'}
      <div class="tertiary-header">
        <h3>Edit Companion</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <CompanionForm
          companion={tertiarySidebarContent.data?.companion}
          onSuccess={(companion) => {
            closeTertiarySidebar();
            // Dispatch event to refresh companions list
            window.dispatchEvent(new CustomEvent('companions-updated', { detail: { companion } }));
          }}
          onCancel={closeTertiarySidebar}
        />
      </div>
    {/if}
  </div>
</MapLayout>

<style>
  .primary-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 0;
  }

  .header-section {
    padding: 0;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header-top h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
  }

  .header-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .add-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 0.425rem;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .add-btn:hover {
    background: #0056b3;
  }

  .add-btn :global(.material-symbols-outlined) {
    font-size: 1.25rem !important;
  }

  .icon-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0;
    width: 2rem;
    height: 2rem;
    border-radius: 0.425rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icon-btn:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  .icon-btn :global(.material-symbols-outlined) {
    font-size: 1.25rem !important;
  }

  .tabs {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0 0;
  }

  .tabs-left {
    display: flex;
    gap: 1rem;
  }

  .tab-btn {
    background: none;
    border: none;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.425rem 0.425rem 0 0;
  }

  .tab-btn:hover {
    color: #333;
    background-color: #e0e0e0;
  }

  .tab-btn.active {
    color: #007bff;
    border-bottom-color: #007bff;
    background-color: rgba(255, 255, 255, 0.9);
  }

  .tab-btn.settings-btn {
    padding: 0.4rem 0.8rem;
  }

  .tab-btn.settings-btn.active {
    border-bottom-color: #007bff;
  }

  .tab-btn.settings-btn :global(.material-symbols-outlined) {
    font-size: 1.1rem !important;
    line-height: 1.1em !important;
  }

  .trips-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .trips-content::-webkit-scrollbar {
    display: none;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    color: #666;
  }

  .empty-icon {
    font-size: 3rem !important;
    color: #ccc;
    margin-bottom: 1rem;
  }

  .trips-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 1rem 0;
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

  .trip-card {
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
    background: #ffffff90;
    overflow: hidden;
    transition: all 0.2s;
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

  .trip-info {
    flex: 1;
    min-width: 0;
  }

  .trip-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
    margin: 0.2rem 0 0 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #4b5563;
    line-height: 1;
    text-align: left;
  }

  .trip-cities {
    margin: 0.2rem 0 0 0;
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
    font-size: 1.2rem;
  }

  .trip-card:hover .edit-btn {
    opacity: 1;
  }

  .edit-btn:hover {
    color: #3b82f6;
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
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    margin: 0 0.5rem;
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

  .date-header-layovers {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .trip-date-badge {
    display: inline-block;
    padding: 0.2rem 0;
    background: transparent;
    color: #007bff;
    border: none;
    border-radius: 0;
    font-size: 0.65rem;
    font-weight: 700;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.08rem;
    font-style: oblique;
  }

  .trip-item-date-items {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }


  .item-time {
    font-size: 0.7rem;
    font-weight: 500;
    color: #4b5563;
    text-align: center;
    line-height: 1;
    margin: 0;
  }

  .item-dates {
    font-size: 0.75rem;
    color: #666;
    margin: 0;
    line-height: 1.2;
  }


  .item-icon {
    line-height: 1;
    height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    line-height: 1;
    text-align: left;
  }

  .item-route {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
    line-height: 1;
    text-align: left;
  }

  .secondary-content {
    padding: 0;
    color: #666;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  :global(#secondary-sidebar) {
    transition: width 0.3s ease;
  }

  :global(#secondary-sidebar.full-width) {
    width: calc(100% - 340px - 7.5vh) !important;
  }

  :global(#secondary-sidebar.full-width.with-tertiary) {
    width: auto !important;
    left: calc(2.5vh + 340px + 2.5vh) !important;
    right: calc(2.5vh + 340px + 2.5vh) !important;
  }

  .tertiary-content {
    padding: 0;
    color: #666;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .tertiary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .tertiary-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .tertiary-form-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .calendar-sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .calendar-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .calendar-sidebar-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .add-companion-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-companion-btn:hover {
    background-color: #0056b3;
  }

  .add-companion-btn :global(.material-symbols-outlined) {
    font-size: 1.1rem;
  }

  .standalone-item-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem;
    background: #ffffff90;
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
    transition: all 0.2s;
    cursor: pointer;
  }

  .standalone-item-card:hover {
    background-color: #f3f4f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .standalone-item-card .item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.425rem;
    flex-shrink: 0;
    font-size: 0.875rem !important;
  }

  .trip-items .item-icon,
  .trip-items .standalone-item-card .item-icon,
  .trip-items .flight-icon-wrapper .item-icon {
    font-size: 1.1rem !important;
  }

  .standalone-item-card .item-icon.blue {
    background-color: #fef9e6;
    color: #d4a823;
  }

  .standalone-item-card .item-icon.green {
    background-color: #f3e8ff;
    color: #9b6db3;
  }

  .standalone-item-card .item-icon.purple {
    background-color: #ffe6f0;
    color: #d6389f;
  }

  .standalone-item-card .item-icon.gray {
    background-color: #ffe6d6;
    color: #d97a2f;
  }

  .standalone-item-card .item-icon.red {
    background-color: #cce5ff;
    color: #2b7ab6;
  }

  .standalone-item-card .item-icon.amber {
    background-color: #e8e0d5;
    color: #28536b;
  }

  .standalone-item-card .item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .standalone-item-card .item-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1;
    text-align: left;
  }

  .standalone-item-card .item-route {
    font-size: 0.65rem;
    font-weight: 600;
    color: #6b7280;
    margin: 0;
    line-height: 1;
    font-style: italic;
    text-align: left;
  }

  .standalone-item-card .item-time {
    font-size: 0.65rem;
    font-weight: 600;
    color: #4b5563;
    margin: 0;
    line-height: 1;
    text-align: left;
  }

  .standalone-item-card .item-dates {
    font-size: 0.65rem;
    font-weight: 600;
    color: #666;
    margin: 0;
    line-height: 1.2;
    text-align: left;
  }

  /* Flight icon wrapper with time above */
  .flight-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    line-height: 1;
  }

  .flight-icon-wrapper .item-icon {
    padding-top: 0.15rem;
  }

  .flight-time-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: #4b5563;
    margin: 0;
    line-height: 1;
  }

  /* Inverted colors for trip items when trip is expanded */
  .trip-items .standalone-item-card .item-icon.blue {
    background-color: transparent;
    color: #d4a823;
  }

  .trip-items .standalone-item-card .item-icon.green {
    background-color: transparent;
    color: #9b6db3;
  }

  .trip-items .standalone-item-card .item-icon.purple {
    background-color: transparent;
    color: #d6389f;
  }

  .trip-items .standalone-item-card .item-icon.gray {
    background-color: transparent;
    color: #d97a2f;
  }

  .trip-items .standalone-item-card .item-icon.red {
    background-color: transparent;
    color: #2b7ab6;
  }

  .trip-items .standalone-item-card .item-icon.amber {
    background-color: transparent;
    color: #28536b;
  }

  .edit-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .edit-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    transition: all 0.2s;
    border-radius: 0.425rem;
  }

  .close-btn:hover {
    color: #374151;
    background-color: #f3f4f6;
  }

  .edit-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .edit-content pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 0.425rem;
    font-size: 0.75rem;
    overflow-x: auto;
  }

  /* New Item Menu Styles */
  .new-item-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .menu-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .close-menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    transition: all 0.15s;
  }

  .close-menu-btn:hover {
    color: #374151;
    background-color: #f3f4f6;
    border-radius: 0.425rem;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    flex: 1;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 0.425rem;
    background: #ffffff90;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }

  .menu-item:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .menu-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.425rem;
    flex-shrink: 0;
    font-size: 1.25rem !important;
  }

  .menu-item-icon.blue {
    background-color: #fef9e6;
    color: #d4a823;
  }

  .menu-item-icon.green {
    background-color: #f3e8ff;
    color: #9b6db3;
  }

  .menu-item-icon.purple {
    background-color: #ffe6f0;
    color: #d6389f;
  }

  .menu-item-icon.gray {
    background-color: #ffe6d6;
    color: #d97a2f;
  }

  .menu-item-icon.red {
    background-color: #cce5ff;
    color: #2b7ab6;
  }

  .menu-item-icon.amber {
    background-color: #e8e0d5;
    color: #28536b;
  }

  .menu-item-content {
    flex: 1;
    min-width: 0;
  }

  .menu-item-content h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  .menu-item-content p {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.2;
  }

  .menu-arrow {
    font-size: 1rem !important;
    color: #9ca3af;
    flex-shrink: 0;
  }

  .menu-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0.5rem 0;
  }

  .menu-divider::before,
  .menu-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .menu-divider span {
    font-size: 0.75rem;
    color: #6b7280;
    flex-shrink: 0;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .settings-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.75px;
  }

  .settings-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: #ffffff90;
    border: 1px solid #e5e7eb;
    border-radius: 0.425rem;
    color: #374151;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }

  .settings-item:hover {
    border-color: #007bff;
    background-color: #eff6ff;
    color: #007bff;
  }

  .settings-item.logout {
    color: #dc2626;
  }

  .settings-item.logout:hover {
    background-color: #fef2f2;
    border-color: #dc2626;
  }

  .settings-item :global(.material-symbols-outlined) {
    font-size: 1.25rem !important;
    flex-shrink: 0;
  }

  .settings-item span:last-child {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Settings Main Panel (replaces trips in primary sidebar) */
  .settings-main-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .settings-main-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Settings Panel in Secondary Sidebar */
  .settings-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
  }

  .settings-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .settings-panel-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .settings-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .settings-panel-content p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .settings-logout-btn {
    display: inline-block;
    padding: 0.75rem 1rem;
    background: #dc2626;
    color: white;
    text-decoration: none;
    border-radius: 0.425rem;
    font-weight: 600;
    font-size: 0.875rem;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
    margin-top: 1rem;
  }

  .settings-logout-btn:hover {
    background: #b91c1c;
  }

  .layover-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.2rem 0;
    margin: 0.1rem 0;
  }

  .layover-text {
    font-size: 0.65rem;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
    line-height: 1;
    text-align: center;
  }

  .date-header-layover {
    font-size: 0.65rem;
    font-weight: 500;
    color: #6b7280;
    line-height: 1;
    white-space: nowrap;
    padding-right: 0.25rem;
  }
</style>
