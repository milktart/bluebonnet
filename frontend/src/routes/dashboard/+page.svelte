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
  import DashboardHeader from './components/DashboardHeader.svelte';
  import DashboardTripsList from './components/DashboardTripsList.svelte';
  import DashboardItemList from './components/DashboardItemList.svelte';
  import DashboardSettingsPanel from './components/DashboardSettingsPanel.svelte';
  import DashboardItemEditor from './components/DashboardItemEditor.svelte';
  import { parseLocalDate, getTripEndDate, getItemDate, getDateKeyForItem, getDayKeyForItem, groupTripItemsByDate } from '$lib/utils/dashboardGrouping';
  import { formatDate, formatMonthHeader, formatTripDateHeader, formatTimeOnly, formatDateTime, formatDateOnly, capitalize } from '$lib/utils/dashboardFormatters';
  import { getCityName, getTransportIcon, getTransportColor, getTripIcon, getTripCities, calculateLayover, getFlightLayoverInfo, layoverSpansDates } from '$lib/utils/dashboardItem';

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

      // Debug: Log standalone items with companions
      console.log('[Dashboard] Loaded standalone items:', {
        flights: standaloneItems.flights?.length || 0,
        hotels: standaloneItems.hotels?.length || 0,
        transportation: standaloneItems.transportation?.length || 0,
        carRentals: standaloneItems.carRentals?.length || 0,
        events: standaloneItems.events?.length || 0,
        fullStandalone: standaloneItems
      });

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

      // Debug: Log trip items to see if companions are loaded
      detailedTrips.forEach(trip => {
        console.log(`[Dashboard] Trip ${trip.id} (${trip.name}):`, {
          flightCount: trip.flights?.length || 0,
          hotelCount: trip.hotels?.length || 0,
          eventCount: trip.events?.length || 0,
          travelCompanions: trip.travelCompanions,
          travelCompanionCount: trip.travelCompanions?.length || 0,
        });
        if (trip.flights && trip.flights.length > 0) {
          trip.flights.forEach(f => {
            const companionCount = f.itemCompanions?.length || 0;
            console.log(`  - Flight ${f.id}: ${companionCount} companions`);
          });
        }
        if (trip.events && trip.events.length > 0) {
          trip.events.forEach(e => {
            const companionCount = e.itemCompanions?.length || 0;
            console.log(`  - Event ${e.id}: ${companionCount} companions`);
          });
        }
      });

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
          if (item.itemCompanions) {
            console.log(`[Dashboard] Standalone ${itemTypeMap[key]} ${item.id} has ${item.itemCompanions.length} companions:`, item.itemCompanions);
          }
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
        if (trip.flights) {
          trip.flights.forEach((f: any) => {
            if (f.itemCompanions) {
              console.log(`[Dashboard] Trip flight ${f.id} has ${f.itemCompanions.length} companions:`, f.itemCompanions);
            }
          });
          combined.flights.push(...trip.flights.map((f: any) => ({ ...f, tripId: trip.id })));
        }
        if (trip.hotels) {
          trip.hotels.forEach((h: any) => {
            if (h.itemCompanions) {
              console.log(`[Dashboard] Trip hotel ${h.id} has ${h.itemCompanions.length} companions:`, h.itemCompanions);
            }
          });
          combined.hotels.push(...trip.hotels.map((h: any) => ({ ...h, tripId: trip.id })));
        }
        if (trip.events) {
          trip.events.forEach((e: any) => {
            if (e.itemCompanions) {
              console.log(`[Dashboard] Trip event ${e.id} has ${e.itemCompanions.length} companions:`, e.itemCompanions);
            }
          });
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
    console.log('[Dashboard] handleItemClick:', {
      type,
      itemType,
      itemId: data?.id,
      hasItemCompanions: !!data?.itemCompanions,
      companionCount: data?.itemCompanions?.length || 0,
      itemCompanions: data?.itemCompanions
    });
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
        <DashboardSettingsPanel
          user={$authStore.user}
          on:settingClick={(e) => {
            const { type, data } = e.detail;
            secondarySidebarContent = { type, data };
          }}
        />
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
        <DashboardTripsList
          {trips}
          {filteredItems}
          {expandedTrips}
          {highlightedTripId}
          {highlightedItemId}
          {highlightedItemType}
          on:expandTrip={(e) => {
            toggleTripExpanded(e.detail.tripId);
          }}
          on:hoverTrip={(e) => {
            highlightedTripId = e.detail.tripId;
          }}
          on:leaveTrip={() => {
            highlightedTripId = null;
          }}
          on:editTrip={(e) => {
            secondarySidebarContent = { type: 'item', itemType: 'trip', data: e.detail.trip };
          }}
          on:hoverItem={(e) => {
            highlightedItemType = e.detail.itemType;
            highlightedItemId = e.detail.itemId;
          }}
          on:leaveItem={() => {
            highlightedItemId = null;
            highlightedItemType = null;
          }}
          on:itemClick={(e) => {
            handleItemClick(e.detail.itemType, e.detail.itemType, e.detail.data);
          }}
        />
        <DashboardItemList
          {filteredItems}
          {groupedItems}
          {dateKeysInOrder}
          {highlightedItemId}
          {highlightedItemType}
          on:hoverItem={(e) => {
            highlightedItemType = e.detail.itemType;
            highlightedItemId = e.detail.itemId;
          }}
          on:leaveItem={() => {
            highlightedItemId = null;
            highlightedItemType = null;
          }}
          on:itemClick={(e) => {
            handleItemClick(e.detail.itemType, e.detail.itemType, e.detail.data);
          }}
        />
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
        on:close={closeSecondarySidebar}
        on:save={async (e) => {
          const item = e.detail;
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
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin: 0 0 0.75rem;
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
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    margin: 0 0 0.75rem;
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
</style>
