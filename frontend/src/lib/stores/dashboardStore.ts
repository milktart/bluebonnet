/**
 * Dashboard Store - Centralized state management for the dashboard
 *
 * This Svelte store manages all dashboard-related state:
 * - Trip and item data
 * - UI state (tabs, views, expanded items)
 * - Sidebar content and visibility
 * - Map highlighting and data
 * - Loading and error states
 *
 * Replaces 16 local variables previously scattered in +page.svelte
 * Enables:
 * - Centralized state management
 * - Reactive updates across components
 * - Easy testing and debugging
 * - Future features (undo/redo, time-travel debugging, etc.)
 *
 * Usage:
 * import { dashboardStore, dashboardStoreActions } from '$lib/stores/dashboardStore';
 *
 * // Read state
 * $: trips = $dashboardStore.trips;
 *
 * // Update state
 * dashboardStoreActions.setTrips(newTrips);
 * dashboardStoreActions.setActiveTab('past');
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  Trip,
  Flight,
  Hotel,
  Event,
  CarRental,
  Transportation,
  SidebarContent,
  DashboardState,
  DashboardItem,
  GroupedDashboardItems,
  TravelItemType,
} from '../../../types/index.js';

/**
 * Initial state for dashboard store
 * Mirrors DashboardState interface from types/index.ts
 */
const initialState: DashboardState = {
  // Data
  trips: [],
  standaloneItems: {
    flights: [],
    hotels: [],
    transportation: [],
    carRentals: [],
    events: [],
  },

  // Filtering
  activeTab: 'upcoming',
  filteredItems: [],

  // UI State
  activeView: 'trips',
  expandedTrips: new Set(),
  selectedItemId: null,
  selectedItemType: null,
  showNewItemMenu: false,

  // Sidebar
  secondarySidebarContent: null,
  tertiarySidebarContent: null,

  // Map
  mapData: {
    flights: [],
    hotels: [],
    events: [],
    transportation: [],
    carRentals: [],
  },
  highlightedTripId: null,
  highlightedItemId: null,
  highlightedItemType: null,

  // Grouping
  groupedItems: {},
  dateKeysInOrder: [],

  // Loading/Error
  loading: false,
  error: null,
};

/**
 * Main dashboard store
 * Writable store containing all dashboard state
 */
export const dashboardStore: Writable<DashboardState> = writable(initialState);

/**
 * DERIVED STORES
 * Computed values derived from main store
 */

/**
 * Upcoming trips count
 */
export const upcomingTripsCount: Readable<number> = derived(
  dashboardStore,
  ($store) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return $store.trips.filter((t) => new Date(t.departureDate) >= now).length;
  }
);

/**
 * Past trips count
 */
export const pastTripsCount: Readable<number> = derived(
  dashboardStore,
  ($store) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return $store.trips.filter((t) => {
      const endDate = new Date(t.returnDate || t.departureDate);
      return endDate < now;
    }).length;
  }
);

/**
 * Whether sidebar is open (secondary or tertiary)
 */
export const anySidebarOpen: Readable<boolean> = derived(
  dashboardStore,
  ($store) => $store.secondarySidebarContent !== null || $store.tertiarySidebarContent !== null
);

/**
 * Whether secondary sidebar is open
 */
export const secondarySidebarOpen: Readable<boolean> = derived(
  dashboardStore,
  ($store) => $store.secondarySidebarContent !== null
);

/**
 * Whether tertiary sidebar is open
 */
export const tertiarySidebarOpen: Readable<boolean> = derived(
  dashboardStore,
  ($store) => $store.tertiarySidebarContent !== null
);

/**
 * DASHBOARD STORE ACTIONS
 * All state mutations go through these action methods
 *
 * Organized by category:
 * - Data loading and updates
 * - Filtering and grouping
 * - UI state management
 * - Sidebar management
 * - Map highlighting
 * - Loading/error states
 */

export const dashboardStoreActions = {
  /**
   * TRIP DATA MANAGEMENT
   */

  /**
   * Set all trips (used after data load)
   */
  setTrips(trips: Trip[]) {
    dashboardStore.update((state) => ({
      ...state,
      trips,
    }));
  },

  /**
   * Add a single trip
   */
  addTrip(trip: Trip) {
    dashboardStore.update((state) => ({
      ...state,
      trips: [...state.trips, trip],
    }));
  },

  /**
   * Update a trip by ID
   */
  updateTrip(id: string, data: Partial<Trip>) {
    dashboardStore.update((state) => ({
      ...state,
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  },

  /**
   * Delete a trip by ID (also closes any related sidebars)
   */
  deleteTrip(id: string) {
    dashboardStore.update((state) => {
      const newExpandedTrips = new Set([...state.expandedTrips]);
      newExpandedTrips.delete(id);

      // Close sidebars if they show content for this trip
      let newSecondarySidebar = state.secondarySidebarContent;
      let newTertiarySidebar = state.tertiarySidebarContent;

      if (newSecondarySidebar?.data.id === id || newSecondarySidebar?.data.tripId === id) {
        newSecondarySidebar = null;
      }
      if (newTertiarySidebar?.data.id === id || newTertiarySidebar?.data.tripId === id) {
        newTertiarySidebar = null;
      }

      return {
        ...state,
        trips: state.trips.filter((t) => t.id !== id),
        expandedTrips: newExpandedTrips,
        secondarySidebarContent: newSecondarySidebar,
        tertiarySidebarContent: newTertiarySidebar,
      };
    });
  },

  /**
   * STANDALONE ITEMS MANAGEMENT
   */

  /**
   * Set all standalone items
   */
  setStandaloneItems(items: {
    flights: Flight[];
    hotels: Hotel[];
    transportation: Transportation[];
    carRentals: CarRental[];
    events: Event[];
  }) {
    dashboardStore.update((state) => ({
      ...state,
      standaloneItems: items,
    }));
  },

  /**
   * Add a single standalone item
   */
  addStandaloneItem(itemType: TravelItemType, item: Flight | Hotel | Event | CarRental | Transportation) {
    dashboardStore.update((state) => {
      const itemsKey = `${itemType}s` as
        | 'flights'
        | 'hotels'
        | 'transportation'
        | 'carRentals'
        | 'events';
      return {
        ...state,
        standaloneItems: {
          ...state.standaloneItems,
          [itemsKey]: [...state.standaloneItems[itemsKey], item],
        },
      };
    });
  },

  /**
   * Delete a standalone item
   */
  deleteStandaloneItem(itemType: TravelItemType, itemId: string) {
    dashboardStore.update((state) => {
      const itemsKey = `${itemType}s` as
        | 'flights'
        | 'hotels'
        | 'transportation'
        | 'carRentals'
        | 'events';
      return {
        ...state,
        standaloneItems: {
          ...state.standaloneItems,
          [itemsKey]: state.standaloneItems[itemsKey].filter((item: any) => item.id !== itemId),
        },
      };
    });
  },

  /**
   * FILTERING
   */

  /**
   * Set active tab (upcoming or past)
   */
  setActiveTab(tab: 'upcoming' | 'past') {
    dashboardStore.update((state) => ({
      ...state,
      activeTab: tab,
      // Close secondary sidebar when switching tabs
      secondarySidebarContent: null,
    }));
  },

  /**
   * Set filtered items (after filtering/grouping in +page.svelte)
   */
  setFilteredItems(items: DashboardItem[]) {
    dashboardStore.update((state) => ({
      ...state,
      filteredItems: items,
    }));
  },

  /**
   * Set grouped items and date keys (after grouping by date)
   */
  setGroupedItems(grouped: GroupedDashboardItems, dateKeys: string[]) {
    dashboardStore.update((state) => ({
      ...state,
      groupedItems: grouped,
      dateKeysInOrder: dateKeys,
    }));
  },

  /**
   * UI STATE
   */

  /**
   * Set active view (trips or settings)
   */
  setActiveView(view: 'trips' | 'settings') {
    dashboardStore.update((state) => ({
      ...state,
      activeView: view,
    }));
  },

  /**
   * Toggle trip expansion (show/hide items)
   */
  toggleTripExpanded(tripId: string) {
    console.log('[dashboardStoreActions.toggleTripExpanded] Called with tripId:', tripId);
    dashboardStore.update((state) => {
      const newExpanded = new Set(state.expandedTrips);
      console.log('[dashboardStoreActions.toggleTripExpanded] Current expandedTrips:', Array.from(newExpanded));
      if (newExpanded.has(tripId)) {
        newExpanded.delete(tripId);
        console.log('[dashboardStoreActions.toggleTripExpanded] Deleted from set, new expandedTrips:', Array.from(newExpanded));
      } else {
        newExpanded.add(tripId);
        console.log('[dashboardStoreActions.toggleTripExpanded] Added to set, new expandedTrips:', Array.from(newExpanded));
      }
      return {
        ...state,
        expandedTrips: newExpanded,
      };
    });
  },

  /**
   * Set which trip is expanded (direct set, not toggle)
   */
  setExpandedTrips(tripIds: Set<string>) {
    dashboardStore.update((state) => ({
      ...state,
      expandedTrips: tripIds,
    }));
  },

  /**
   * Set new item menu visibility
   */
  setShowNewItemMenu(show: boolean) {
    dashboardStore.update((state) => ({
      ...state,
      showNewItemMenu: show,
    }));
  },

  /**
   * SIDEBAR MANAGEMENT
   */

  /**
   * Open secondary sidebar with content
   */
  openSecondarySidebar(content: SidebarContent) {
    dashboardStore.update((state) => ({
      ...state,
      secondarySidebarContent: content,
      showNewItemMenu: false,
    }));
  },

  /**
   * Close secondary sidebar
   */
  closeSecondarySidebar() {
    dashboardStore.update((state) => ({
      ...state,
      secondarySidebarContent: null,
      showNewItemMenu: false,
    }));
  },

  /**
   * Open tertiary sidebar with content
   */
  openTertiarySidebar(content: SidebarContent) {
    dashboardStore.update((state) => ({
      ...state,
      tertiarySidebarContent: content,
    }));
  },

  /**
   * Close tertiary sidebar
   */
  closeTertiarySidebar() {
    dashboardStore.update((state) => ({
      ...state,
      tertiarySidebarContent: null,
    }));
  },

  /**
   * Close all sidebars
   */
  closeAllSidebars() {
    dashboardStore.update((state) => ({
      ...state,
      secondarySidebarContent: null,
      tertiarySidebarContent: null,
      showNewItemMenu: false,
    }));
  },

  /**
   * MAP HIGHLIGHTING
   */

  /**
   * Set highlighted trip for map
   */
  setHighlightedTrip(tripId: string | null) {
    dashboardStore.update((state) => ({
      ...state,
      highlightedTripId: tripId,
    }));
  },

  /**
   * Set highlighted item for map
   */
  setHighlightedItem(itemId: string | null, itemType: TravelItemType | null) {
    dashboardStore.update((state) => ({
      ...state,
      highlightedItemId: itemId,
      highlightedItemType: itemType,
    }));
  },

  /**
   * Clear all highlights
   */
  clearHighlights() {
    dashboardStore.update((state) => ({
      ...state,
      highlightedTripId: null,
      highlightedItemId: null,
      highlightedItemType: null,
    }));
  },

  /**
   * Set map data
   */
  setMapData(mapData: {
    flights: Flight[];
    hotels: Hotel[];
    events: Event[];
    transportation: Transportation[];
    carRentals: CarRental[];
  }) {
    dashboardStore.update((state) => ({
      ...state,
      mapData,
    }));
  },

  /**
   * LOADING & ERROR STATE
   */

  /**
   * Set loading state
   */
  setLoading(loading: boolean) {
    dashboardStore.update((state) => ({
      ...state,
      loading,
    }));
  },

  /**
   * Set error message
   */
  setError(error: string | null) {
    dashboardStore.update((state) => ({
      ...state,
      error,
    }));
  },

  /**
   * RESET
   */

  /**
   * Reset to initial state (used for logout, etc.)
   */
  reset() {
    dashboardStore.set(JSON.parse(JSON.stringify(initialState)));
  },

  /**
   * Soft reset (keep data, reset UI state)
   */
  softReset() {
    dashboardStore.update((state) => ({
      ...state,
      activeTab: 'upcoming',
      activeView: 'trips',
      expandedTrips: new Set(),
      showNewItemMenu: false,
      secondarySidebarContent: null,
      tertiarySidebarContent: null,
      highlightedTripId: null,
      highlightedItemId: null,
      highlightedItemType: null,
      error: null,
    }));
  },
};
