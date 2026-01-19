<script lang="ts">
  import { goto, pushState } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { authStore, authStoreActions } from '$lib/stores/authStore';
  import { tripsApi, flightsApi, hotelsApi, transportationApi, carRentalsApi, eventsApi } from '$lib/services/api';
  import { dataService, setupDataSyncListener } from '$lib/services/dataService';
  import { dashboardStore, dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { formatTimeInTimezone, formatDateTimeInTimezone } from '$lib/utils/timezoneUtils';
  import ResponsiveLayout from '$lib/components/ResponsiveLayout.svelte';
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
  import UserForm from '$lib/components/UserForm.svelte';
  import AirportForm from '$lib/components/AirportForm.svelte';
  import CompanionIndicators from '$lib/components/CompanionIndicators.svelte';
  import DashboardHeader from './components/DashboardHeader.svelte';
  import DashboardSettingsPanel from './components/DashboardSettingsPanel.svelte';
  import DashboardItemEditor from './components/DashboardItemEditor.svelte';
  import ItemsList from '$lib/components/ItemsList.svelte';
  import { parseLocalDate, getTripEndDate, getItemDate, getDateKeyForItem, getDayKeyForItem, groupTripItemsByDate } from '$lib/utils/dashboardGrouping';
  import { formatDate, formatMonthHeader, formatTripDateHeader, formatTimeOnly, formatDateTime, formatDateOnly, capitalize, calculateNights } from '$lib/utils/dashboardFormatters';
  import { getCityName, getTransportIcon, getTransportColor, getTripIcon, getTripCities, calculateLayover, getFlightLayoverInfo, layoverSpansDates } from '$lib/utils/dashboardItem';

  // Props passed from layout routes
  export let tripIdToExpand: string | null = null;
  export let shouldOpenCalendar: boolean = false;

  // Track whether the calendar was explicitly closed by the user
  let calendarExplicitlyClosed = false;
  // Track which tripId was last auto-expanded to avoid re-expanding
  let lastAutoExpandedTripId: string | null = null;
  // Current logged-in user ID
  let currentUserId: string | null = null;

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

  // Mobile-specific state
  let mobileActiveTab: 'list' | 'add' | 'calendar' | 'settings' = 'list';
  let mobileSelectedItem: any = null;
  let mobileSelectedItemType: string | null = null;
  let mobileFormState: null | { type: 'trip' | 'flight' | 'hotel' | 'transportation' | 'carRental' | 'event'; tripId?: string; itemId?: string; data?: any } = null;

  // Store subscriptions - sync local state with centralized dashboardStore
  let unsubscribe: (() => void) | null = null;

  function syncStoreState() {
    unsubscribe = dashboardStore.subscribe(($store) => {
      trips = $store.trips;
      standaloneItems = $store.standaloneItems;
      filteredItems = $store.filteredItems;
      activeTab = $store.activeTab;
      activeView = $store.activeView;
      loading = $store.loading;
      error = $store.error;
      const oldExpandedTrips = expandedTrips;
      expandedTrips = $store.expandedTrips;
      mapData = $store.mapData;
      highlightedTripId = $store.highlightedTripId;
      highlightedItemId = $store.highlightedItemId;
      highlightedItemType = $store.highlightedItemType;
      secondarySidebarContent = $store.secondarySidebarContent;
      tertiarySidebarContent = $store.tertiarySidebarContent;
      showNewItemMenu = $store.showNewItemMenu;
      groupedItems = $store.groupedItems;
      dateKeysInOrder = $store.dateKeysInOrder;
    });
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

  // Auto-expand trip when tripIdToExpand prop is set
  $: if (tripIdToExpand && $dashboardStore.trips.length > 0) {
    // Only auto-expand if this is a NEW trip (different from last time)
    if (tripIdToExpand !== lastAutoExpandedTripId) {
      lastAutoExpandedTripId = tripIdToExpand;

      if (!$dashboardStore.expandedTrips.has(tripIdToExpand)) {
        dashboardStoreActions.toggleTripExpanded(tripIdToExpand);
      }
    }

    // On mobile: set selected item to show trip detail view
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      const selectedTrip = $dashboardStore.trips.find((t) => t.id === tripIdToExpand);
      if (selectedTrip && mobileSelectedItem?.id !== tripIdToExpand) {
        mobileSelectedItem = selectedTrip;
        mobileSelectedItemType = 'trip';
      }
    }
  }

  // Clear lastAutoExpandedTripId when navigating away from trip detail
  $: if (!tripIdToExpand && lastAutoExpandedTripId) {
    lastAutoExpandedTripId = null;
  }

  // Open calendar sidebar after data loads if requested (but not if user explicitly closed it)
  $: if (shouldOpenCalendar && $dashboardStore.trips.length > 0 && !secondarySidebarContent?.type && !calendarExplicitlyClosed) {
    dashboardStoreActions.openSecondarySidebar({ type: 'calendar', data: {} });
  }

  // Manage secondary sidebar full-width class and tertiary presence
  $: if (typeof window !== 'undefined' && secondarySidebarContent) {
    const sidebarEl = document.getElementById('secondary-sidebar');
    if (sidebarEl) {
      // Apply full-width to certain content types
      const shouldBeFullWidth = ['calendar', 'settings-vouchers', 'settings-companions', 'settings-backup', 'settings-users', 'settings-airports'].includes(
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
    dashboardStoreActions.setLoading(true);
    try {
      // Use dataService for smart caching and batch fetching
      await dataService.loadAllTrips();
      await dataService.loadStandaloneItems('all');
      filterTrips();
      updateMapData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load trips';
      dashboardStoreActions.setError(errorMsg);
    } finally {
      dashboardStoreActions.setLoading(false);
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

  function handleAddUser() {
    openTertiarySidebar('add-user', {});
  }

  function handleEditUser(event: any) {
    const user = event.detail?.user;
    if (user) {
      openTertiarySidebar('edit-user', { user });
    }
  }

  function handleMobileEdit(event: any) {
    const { item, itemType } = event.detail;
    if (item && itemType) {
      mobileFormState = {
        type: itemType,
        tripId: item.tripId || null,
        itemId: item.id,
        data: item
      };
    }
  }

  function handleMobileDelete(event: any) {
    const { item, itemType } = event.detail;
    if (item && itemType) {
      // Show confirmation
      if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
        deleteItem(itemType, item.id);
      }
    }
  }

  async function deleteItem(itemType: string, itemId: string) {
    try {
      const apis: Record<string, any> = {
        'trip': tripsApi,
        'flight': flightsApi,
        'hotel': hotelsApi,
        'transportation': transportationApi,
        'carRental': carRentalsApi,
        'event': eventsApi
      };

      const api = apis[itemType];
      if (api && api.delete) {
        await api.delete(itemId);
        mobileSelectedItem = null;
        mobileSelectedItemType = null;
        await loadTripData();
      }
    } catch (err) {
      console.error(`Failed to delete ${itemType}:`, err);
      error = `Failed to delete ${itemType}. Please try again.`;
    }
  }

  onMount(async () => {
    // First, verify session and populate auth store with current user
    try {
      const sessionResponse = await fetch('/auth/verify-session', {
        credentials: 'include'
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.authenticated && sessionData.user) {
          authStoreActions.setUser(sessionData.user);
          currentUserId = sessionData.user.id;
        }
      }
    } catch (err) {
      // Session verification failed, continue anyway
    }

    // Subscribe to auth store for reactive updates
    const unsubscribeAuth = authStore.subscribe(($authStore) => {
      currentUserId = $authStore.user?.id || null;
    });

    // Initialize store synchronization
    syncStoreState();

    // Setup cross-tab data synchronization
    setupDataSyncListener();

    // Listen for data changes from other tabs
    window.addEventListener('dataChanged', async (e: any) => {
      const { type } = e.detail;
      if (type.includes('trip')) {
        dataService.invalidateCache('trip');
        await loadTripData();
      } else if (type.includes('item')) {
        dataService.invalidateCache('item');
        await loadTripData();
      }
    });

    // Load initial data
    await loadTripData();

    // Check for section query parameter to auto-open settings
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section) {
        dashboardStoreActions.setActiveView('settings');
        dashboardStoreActions.openSecondarySidebar({ type: section, data: {} });
      }
    }

    // Listen for data import events
    window.addEventListener('dataImported', handleDataImported);

    // Listen for companion add/edit events from SettingsCompanions
    window.addEventListener('add-companion', handleAddCompanion);
    window.addEventListener('edit-companion', handleEditCompanion);

    // Listen for user add/edit events from SettingsUsers
    window.addEventListener('add-user', handleAddUser);
    window.addEventListener('edit-user', handleEditUser);

    // Listen for mobile edit/delete events from MobileTripDetailView (via MapLayout)
    window.addEventListener('mobileEdit', handleMobileEdit);
    window.addEventListener('mobileDelete', handleMobileDelete);

    // Store form data when switching between mobile and desktop to preserve user input
    let formDataBuffer: any = null;

    // Sync form state when resizing between mobile and desktop
    const handleResponsiveResize = () => {
      const isMobile = window.innerWidth < 640;

      // When transitioning to mobile, move any sidebar form to mobile modal
      if (isMobile) {
        // If there's a form in secondary sidebar, save it to mobileFormState
        if (secondarySidebarContent?.type && secondarySidebarContent?.itemType && !mobileFormState) {
          // Capture current form data from the form element to preserve user input
          const formElement = document.querySelector('.edit-panel:not(.modal-container) form');
          if (formElement instanceof HTMLFormElement) {
            const formData = new FormData(formElement);
            formDataBuffer = Object.fromEntries(formData);
          }

          mobileFormState = {
            type: secondarySidebarContent.itemType as any,
            data: formDataBuffer || secondarySidebarContent.data || null
          };
          // Don't close the sidebar - just let CSS hide it. The store still has the content.
        }
      }
      // When transitioning to desktop, move mobile form state back to secondary sidebar if applicable
      else if (!isMobile && mobileFormState && !secondarySidebarContent?.itemType) {
        // Capture current form data from the mobile form to preserve user input
        const formElement = document.querySelector('.edit-panel.modal-container form');
        if (formElement instanceof HTMLFormElement) {
          const formData = new FormData(formElement);
          formDataBuffer = Object.fromEntries(formData);
        }

        dashboardStoreActions.openSecondarySidebar({
          type: mobileFormState.type,
          itemType: mobileFormState.type,
          data: formDataBuffer || mobileFormState.data || {}
        });
        mobileFormState = null;
        formDataBuffer = null;
      }
    };

    window.addEventListener('resize', handleResponsiveResize);

    return () => {
      // Cleanup subscriptions
      if (unsubscribe) unsubscribe();

      window.removeEventListener('dataImported', handleDataImported);
      window.removeEventListener('add-companion', handleAddCompanion);
      window.removeEventListener('edit-companion', handleEditCompanion);
      window.removeEventListener('add-user', handleAddUser);
      window.removeEventListener('edit-user', handleEditUser);
      window.removeEventListener('mobileEdit', handleMobileEdit);
      window.removeEventListener('mobileDelete', handleMobileDelete);
      window.removeEventListener('dataChanged', () => {});
      window.removeEventListener('resize', handleResponsiveResize);
    };
  });


  function filterTrips() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allItems: any[] = [];

    // Add trips as items (use store data)
    $dashboardStore.trips.forEach((trip) => {
      allItems.push({
        type: 'trip',
        data: trip,
        sortDate: trip.departureDate ? parseLocalDate(trip.departureDate) : new Date(0)
      });
    });

    // Add standalone items (use store data)
    ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach((key) => {
      const itemTypeMap: Record<string, string> = {
        flights: 'flight',
        hotels: 'hotel',
        transportation: 'transportation',
        carRentals: 'carRental',
        events: 'event'
      };

      if ($dashboardStore.standaloneItems[key]) {
        $dashboardStore.standaloneItems[key].forEach((item: any) => {
          allItems.push({
            type: 'standalone',
            itemType: itemTypeMap[key],
            data: item,
            sortDate: getItemDate(item, itemTypeMap[key])
          });
        });
      }
    });

    // Filter by upcoming/past (use store activeTab)
    let filtered: any[] = [];
    if ($dashboardStore.activeTab === 'upcoming') {
      filtered = allItems.filter((item) => {
        if (item.type === 'trip') {
          const endDate = getTripEndDate(item.data);
          return endDate >= now;
        } else {
          return item.sortDate >= now;
        }
      });
      // Sort chronologically (oldest first)
      filtered.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    } else if ($dashboardStore.activeTab === 'past') {
      filtered = allItems.filter((item) => {
        if (item.type === 'trip') {
          const endDate = getTripEndDate(item.data);
          return endDate < now;
        } else {
          return item.sortDate < now;
        }
      });
      // Sort reverse chronologically (most recent first)
      filtered.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    }

    // Update store with filtered items
    dashboardStoreActions.setFilteredItems(filtered);
  }

  function updateMapData() {
    const combined = {
      flights: [],
      hotels: [],
      events: [],
      transportation: [],
      carRentals: []
    };

    // Add items from trips (use store data)
    $dashboardStore.filteredItems.forEach(item => {
      if (item.type === 'trip') {
        const trip = item.data;
        // Ensure each item has tripId attached so map highlighting can filter by trip
        if (trip.flights) {
          combined.flights.push(...trip.flights.map((f: any) => ({ ...f, tripId: trip.id })));
        }
        if (trip.hotels) {
          combined.hotels.push(...trip.hotels.map((h: any) => ({ ...h, tripId: trip.id })));
        }
        if (trip.events) {
          combined.events.push(...trip.events.map((e: any) => ({ ...e, tripId: trip.id })));
        }
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

    // Update store with map data
    dashboardStoreActions.setMapData(combined);
  }


  function handleTabChange(tab: 'upcoming' | 'past') {
    dashboardStoreActions.setActiveTab(tab);
    dashboardStoreActions.closeSecondarySidebar();
    dashboardStoreActions.closeTertiarySidebar();
    dashboardStoreActions.setActiveView('trips');
    filterTrips();
    updateMapData();
    // Update URL to /dashboard when switching tabs
    if (typeof window !== 'undefined') {
      pushState('/dashboard', {});
    }
  }

  async function handleDeleteTrip(tripId: string, event: Event) {
    event.stopPropagation();
    try {
      await tripsApi.delete(tripId);
      dashboardStoreActions.deleteTrip(tripId);
      dataService.invalidateCache('trip');
      filterTrips();
      updateMapData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete trip';
      dashboardStoreActions.setError(errorMsg);
    }
  }

  function handleCreateTrip() {
    dashboardStoreActions.setShowNewItemMenu(true);
    dashboardStoreActions.openSecondarySidebar({ type: 'newItemMenu', data: {} });
  }

  async function handleCalendarClick() {
    dashboardStoreActions.openSecondarySidebar({ type: 'calendar', data: {} });
    updateSecondarySidebarClass();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/calendar');
    }
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

  async function handleNewTripClick() {
    dashboardStoreActions.setShowNewItemMenu(false);
    dashboardStoreActions.openSecondarySidebar({ type: 'trip', itemType: 'trip', data: {} });
    if (typeof window !== 'undefined') {
      await goto('/');
    }
  }

  async function handleNewItemClick(itemType: string) {
    dashboardStoreActions.setShowNewItemMenu(false);
    dashboardStoreActions.openSecondarySidebar({ type: itemType, itemType, data: {} });
    if (typeof window !== 'undefined') {
      await goto('/');
    }
  }

  function toggleTripExpanded(tripId: string) {
    dashboardStoreActions.toggleTripExpanded(tripId);
  }

  function handleTripHover(tripId: string) {
    dashboardStoreActions.setHighlightedTrip(tripId);
  }

  function handleTripLeave() {
    dashboardStoreActions.setHighlightedTrip(null);
  }

  function handleItemHover(itemType: string, itemId: string) {
    dashboardStoreActions.setHighlightedItem(itemId, itemType);
  }

  function handleItemLeave() {
    dashboardStoreActions.setHighlightedItem(null, null);
  }

  function handleItemClick(type: string, itemType: string | null, data: any) {
    dashboardStoreActions.openSecondarySidebar({ type, itemType: itemType || undefined, data });
    if (typeof window !== 'undefined' && data?.id && itemType) {
      pushState(`/item/${data.id}`, {});
    }
  }

  function closeSecondarySidebar() {
    if (secondarySidebarContent?.type === 'calendar') {
      calendarExplicitlyClosed = true;
      // Update URL when closing calendar
      if (typeof window !== 'undefined') {
        pushState('/dashboard', {});
      }
    } else if (secondarySidebarContent?.type === 'trip' && secondarySidebarContent?.data?.id) {
      // Update URL when closing trip edit form - go back to dashboard
      if (typeof window !== 'undefined') {
        pushState('/dashboard', {});
      }
    } else if (['flight', 'hotel', 'transportation', 'carRental', 'event'].includes(secondarySidebarContent?.type)) {
      // Update URL when closing standalone item edit form - go back to dashboard
      if (typeof window !== 'undefined') {
        pushState('/dashboard', {});
      }
    } else if (['settings-profile', 'settings-security', 'settings-backup', 'settings-vouchers', 'settings-companions', 'settings-users', 'settings-airports'].includes(secondarySidebarContent?.type)) {
      // Update URL when closing settings submenu - go back to settings main menu
      if (typeof window !== 'undefined') {
        pushState('/settings', {});
      }
    }
    dashboardStoreActions.closeSecondarySidebar();
    updateSecondarySidebarClass();
  }

  function openTertiarySidebar(type: string, data: any = {}) {
    dashboardStoreActions.openTertiarySidebar({ type, data });
  }

  function closeTertiarySidebar() {
    dashboardStoreActions.closeTertiarySidebar();
  }

  // Mobile handlers
  function handleMobileItemClick(item: any, itemType: string | null) {
    mobileSelectedItem = item;
    mobileSelectedItemType = itemType;
  }

  // ItemsList component handlers
  function handleItemsListTripExpand(tripId: string) {
    const isCurrentlyExpanded = expandedTrips.has(tripId);
    toggleTripExpanded(tripId);

    // Update URL based on new state (without navigation)
    if (typeof window !== 'undefined') {
      if (isCurrentlyExpanded) {
        // Was expanded, now collapsed - update URL to dashboard
        pushState('/dashboard', {});
      } else {
        // Was collapsed, now expanded - update URL to trip detail
        pushState(`/trip/${tripId}`, {});
      }
    }
  }

  function handleItemsListTripHover(tripId: string | null) {
    if (tripId) {
      handleTripHover(tripId);
    } else {
      handleTripLeave();
    }
  }

  function handleItemsListItemHover(itemType: string | null, itemId: string | null) {
    if (itemType && itemId) {
      handleItemHover(itemType, itemId);
    } else {
      handleItemLeave();
    }
  }

  function handleItemsListItemClick(itemType: string, data: any) {
    handleItemClick(itemType, itemType, data);
  }

  async function updateUrlForSettings(section: string) {
    if (typeof window !== 'undefined') {
      const sectionMap: Record<string, string> = {
        'settings-profile': 'account',
        'settings-security': 'security',
        'settings-backup': 'backup',
        'settings-vouchers': 'vouchers',
        'settings-companions': 'companions',
        'settings-users': 'users',
        'settings-airports': 'airports'
      };
      const url = `/settings/${sectionMap[section] || 'account'}`;
      await goto(url);
    }
  }

  async function handleItemsListTripEdit(trip: any, event: Event) {
    event.stopPropagation();
    // Desktop: expand/collapse trip card
    // Mobile: show trip detail view
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      mobileSelectedItem = trip;
      mobileSelectedItemType = 'trip';
      await goto(`/trip/${trip.id}`);
    } else {
      // Desktop: toggle expand/collapse
      const isCurrentlyExpanded = expandedTrips.has(trip.id);
      toggleTripExpanded(trip.id);

      // Update URL based on new expanded state (without navigation)
      if (typeof window !== 'undefined') {
        if (isCurrentlyExpanded) {
          // Was expanded, now collapsed - update URL to dashboard
          window.history.pushState({}, '', '/dashboard');
        } else {
          // Was collapsed, now expanded - update URL to trip detail
          window.history.pushState({}, '', `/trip/${trip.id}`);
        }
      }
    }
  }

  function handleEditTripIcon(trip: any, event: Event) {
    event.stopPropagation();
    // Open edit form in sidebar (both desktop and mobile)
    dashboardStoreActions.openSecondarySidebar({ type: 'trip', itemType: 'trip', data: trip });
    if (typeof window !== 'undefined') {
      // Update URL without navigation using pushState
      pushState(`/trip/${trip.id}/edit`, {});
    }
  }

</script>

<svelte:head>
  <title>Dashboard - Bluebonnet</title>
</svelte:head>

<ResponsiveLayout
  tripData={mapData}
  isPast={activeTab === 'past'}
  {highlightedTripId}
  highlightedItemType={highlightedItemType}
  highlightedItemId={highlightedItemId}
  allTrips={trips}
  bind:mobileActiveTab
  bind:mobileSelectedItem
  bind:mobileSelectedItemType
>
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
              dashboardStoreActions.setActiveView('trips');
              handleTabChange('upcoming');
            }}
          >
            Upcoming
          </button>
          <button
            class="tab-btn"
            class:active={activeView === 'trips' && activeTab === 'past'}
            on:click={() => {
              dashboardStoreActions.setActiveView('trips');
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
          on:click={() => {
            dashboardStoreActions.setActiveView('settings');
            if (typeof window !== 'undefined') {
              pushState('/settings', {});
            }
          }}
        >
          <span class="material-symbols-outlined" style="font-size: 1.1rem;">settings</span>
        </button>
      </nav>
    </div>

    <div class="trips-content">
      {#if activeView === 'settings'}
        <!-- Settings View -->
        <DashboardSettingsPanel />
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
        <!-- Use unified ItemsList component for consistent rendering -->
        <ItemsList
          items={filteredItems}
          dateKeys={dateKeysInOrder}
          {expandedTrips}
          {highlightedTripId}
          {highlightedItemId}
          {highlightedItemType}
          excludeUserId={currentUserId}
          onTripExpand={handleItemsListTripExpand}
          onTripHover={handleItemsListTripHover}
          onItemHover={handleItemsListItemHover}
          onItemClick={handleItemsListItemClick}
          onTripCardClick={handleItemsListTripEdit}
          onEditIconClick={handleEditTripIcon}
        />
        {#if currentUserId}
          <div style="display:none" data-debug-exclude-user-id={currentUserId}></div>
        {/if}
      {/if}
    </div>
  </div>

    <div
      slot="secondary"
      class="secondary-content"
      class:full-width={secondarySidebarContent?.type === 'calendar' || secondarySidebarContent?.type === 'settings-vouchers' || secondarySidebarContent?.type === 'settings-companions' || secondarySidebarContent?.type === 'settings-backup'}
    >
      <DashboardItemEditor
        {secondarySidebarContent}
        {trips}
        {standaloneItems}
        onCloseSecondarySidebar={closeSecondarySidebar}
        on:close={closeSecondarySidebar}
        on:save={async (e) => {
          const item = e.detail;
          if (!secondarySidebarContent) return;

          // Reload all trip and item data to ensure sidebar formatting is consistent
          // with initial load. This uses the same dataService and filtering logic.
          await loadTripData();
        }}
        on:newTrip={handleCreateTrip}
        on:newItem={(e) => handleNewItemClick(e.detail.itemType)}
        on:tertiarySidebarAction={(e) => {
          openTertiarySidebar(e.detail.action, e.detail.detail);
        }}
        on:itemClick={(e) => {
          handleItemClick(e.detail.itemType, e.detail.itemType, e.detail.data);
        }}
      />
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
    {:else if tertiarySidebarContent?.type === 'add-user'}
      <div class="tertiary-header">
        <h3>Add User</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <UserForm user={null} />
      </div>
    {:else if tertiarySidebarContent?.type === 'edit-user'}
      <div class="tertiary-header">
        <h3>Edit User</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <UserForm user={tertiarySidebarContent.data?.user} />
      </div>
    {:else if tertiarySidebarContent?.type === 'edit-airport'}
      <div class="tertiary-header">
        <h3>Edit Airport</h3>
        <button class="close-btn" on:click={closeTertiarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="tertiary-form-container">
        <AirportForm airport={tertiarySidebarContent.data?.airport} />
      </div>
    {/if}
  </div>

  <!-- Mobile slots -->
  <div slot="mobile-list" class="mobile-list-content">
    {#if loading}
      <Loading message="Loading trips..." />
    {:else if filteredItems.length === 0}
      <div class="mobile-empty-state">
        <span class="material-symbols-outlined">calendar_month</span>
        <p>No {activeTab === 'upcoming' ? 'upcoming' : 'past'} trips</p>
        <Button variant="primary" on:click={() => mobileActiveTab = 'add'}>
          Create Trip
        </Button>
      </div>
    {:else}
      <div class="mobile-trips-list">
        <div class="mobile-tabs-header">
          <button
            class="mobile-tab-switch"
            class:active={activeTab === 'upcoming'}
            on:click={() => handleTabChange('upcoming')}
          >
            Upcoming
          </button>
          <button
            class="mobile-tab-switch"
            class:active={activeTab === 'past'}
            on:click={() => handleTabChange('past')}
          >
            Past
          </button>
        </div>
        <div class="mobile-list-content">
          <!-- Use same ItemsList component as desktop for consistent rendering -->
          <ItemsList
            items={filteredItems}
            dateKeys={dateKeysInOrder}
            {expandedTrips}
            {highlightedTripId}
            {highlightedItemId}
            {highlightedItemType}
            excludeUserId={currentUserId}
            onTripExpand={handleItemsListTripExpand}
            onTripHover={handleItemsListTripHover}
            onItemHover={handleItemsListItemHover}
            onItemClick={(itemType, data) => {
              handleMobileItemClick(data, itemType);
              handleItemsListItemClick(itemType, data);
            }}
            onTripCardClick={(trip, event) => {
              event.stopPropagation();
              handleItemsListTripEdit(trip, event);
            }}
            onEditIconClick={(trip, event) => {
              event.stopPropagation();
              handleEditTripIcon(trip, event);
            }}
          />
        </div>
      </div>
    {/if}
  </div>

  <div slot="mobile-add" class="mobile-add-content">
    {#if !mobileFormState}
      <div class="mobile-add-menu">
        <h3>Create New</h3>
        <button class="mobile-add-option" on:click={() => mobileFormState = { type: 'trip' }}>
          <span class="material-symbols-outlined">flight_takeoff</span>
          <span>Trip</span>
        </button>
        <button class="mobile-add-option" on:click={() => mobileFormState = { type: 'flight' }}>
          <span class="material-symbols-outlined">flight</span>
          <span>Flight</span>
        </button>
        <button class="mobile-add-option" on:click={() => mobileFormState = { type: 'hotel' }}>
          <span class="material-symbols-outlined">hotel</span>
          <span>Hotel</span>
        </button>
        <button class="mobile-add-option" on:click={() => mobileFormState = { type: 'event' }}>
          <span class="material-symbols-outlined">event</span>
          <span>Event</span>
        </button>
        <button class="mobile-add-option" on:click={() => mobileFormState = { type: 'transportation' }}>
          <span class="material-symbols-outlined">train</span>
          <span>Transportation</span>
        </button>
        <button class="mobile-add-option" on:click={() => mobileFormState = { type: 'carRental' }}>
          <span class="material-symbols-outlined">directions_car</span>
          <span>Car Rental</span>
        </button>
      </div>
    {/if}
  </div>

  <div slot="mobile-calendar" class="mobile-calendar-content">
    <DashboardCalendar {trips} {standaloneItems} onItemClick={handleItemClick} />
  </div>

  <div slot="mobile-settings" class="mobile-settings-content">
    <DashboardSettingsPanel />
  </div>
</ResponsiveLayout>

<!-- Mobile Form Modal (Bottom Sheet) - Outside ResponsiveLayout to avoid overflow:hidden clipping -->
{#if typeof window !== 'undefined' && mobileFormState}
  <ItemEditForm
    itemType={mobileFormState.type}
    tripId={mobileFormState?.tripId || ''}
    data={mobileFormState?.data || null}
    allTrips={trips}
    containerType="modal"
    onClose={() => mobileFormState = null}
    onSave={async (e) => {
      mobileFormState = null;
      await loadTripData();
    }}
  />
{/if}

<style>
  @import '$lib/styles/timeline.css';

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
    padding-bottom: 1rem;
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

  .date-header-layovers {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin: 0 0 0.75rem;
  }

  .tertiary-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
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
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin: 0 0 0.75rem;
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
    position: relative;
  }

  .standalone-item-card:hover {
    background-color: #f3f4f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .standalone-item-card .item-companions {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    z-index: 5;
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
    justify-content: center;
    gap: 0.15rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .flight-icon-wrapper .item-icon {
    padding-top: 0;
    line-height: 1;
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
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin: 0 0 0.75rem;
  }

  .edit-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
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

  /* Unconfirmed item styling with diagonal hash pattern */
  .unconfirmed-pattern {
    background:
      repeating-linear-gradient(
        45deg,
        rgba(200, 200, 200, 0.1),
        rgba(200, 200, 200, 0.1) 3px,
        rgba(220, 220, 220, 0.1) 3px,
        rgba(220, 220, 220, 0.1) 6px
      );
  }

  .trip-card.unconfirmed,
  .standalone-item-card.unconfirmed {
    background-blend-mode: multiply;
  }

  .trip-card.unconfirmed::before,
  .standalone-item-card.unconfirmed::before {
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
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin: 0 0 0.75rem;
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

  /* Mobile-specific styles */
  .mobile-list-content,
  .mobile-add-content,
  .mobile-settings-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: clamp(0.5rem, 2vw, 1rem);
    padding-bottom: clamp(0.5rem, 2vw, 1rem);
    scroll-padding-bottom: 70px;
  }

  .mobile-calendar-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: clamp(0.5rem, 2vw, 1rem);
    scroll-padding-bottom: 70px;
  }

  .mobile-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    text-align: center;
  }

  .mobile-empty-state .material-symbols-outlined {
    font-size: 3rem;
    color: #d1d5db;
  }

  .mobile-empty-state p {
    color: #6b7280;
    margin: 0;
  }

  .mobile-tabs-header {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .mobile-tab-switch {
    flex: 1;
    padding: 0.75rem 0.5rem;
    border: none;
    background: none;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s ease;
  }

  .mobile-tab-switch.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
  }

  .mobile-trips-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mobile-trip-item,
  .mobile-item-item {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .mobile-trip-item:active,
  .mobile-item-item:active {
    background: #f9fafb;
  }

  .mobile-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .mobile-item-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    flex: 1;
  }

  .mobile-item-header .material-symbols-outlined {
    color: #d1d5db;
    flex-shrink: 0;
  }

  .mobile-item-dates {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .mobile-item-location {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .mobile-add-menu {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .mobile-add-menu h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
  }

  .mobile-add-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    min-height: 44px;
    transition: all 0.2s ease;
    font-size: 1rem;
    font-weight: 500;
    color: #111827;
  }

  .mobile-add-option:active {
    background: #f9fafb;
  }

  .mobile-add-option .material-symbols-outlined {
    font-size: 1.5rem;
    color: #2563eb;
  }
</style>
