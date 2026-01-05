import { a1 as fallback, a2 as attr_class, a5 as stringify, a3 as escape_html, a4 as bind_props, a8 as attr, a9 as ensure_array_like, aa as clsx, ab as attr_style, X as prevent_snippet_stringification, Z as head } from "../../../chunks/index2.js";
import { p as push_element, a as pop_element } from "../../../chunks/dev.js";
import { F as FILENAME } from "../../../chunks/index-client.js";
import { d as derived, w as writable } from "../../../chunks/index.js";
import { M as MapLayout } from "../../../chunks/MapLayout.js";
import { B as Button } from "../../../chunks/Button.js";
import "clsx";
function getApiBase() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    console.log("[API DEBUG] getApiBase called:", { hostname, protocol, port });
    if (port === "5173") {
      const url = `${protocol}//${hostname}:3501/api`;
      console.log("[API DEBUG] Using Docker dev port 5173, URL:", url);
      return url;
    } else if (hostname === "localhost" || hostname === "127.0.0.1") {
      const url = `${protocol}//localhost:3000/api`;
      console.log("[API DEBUG] Using localhost, URL:", url);
      return url;
    } else {
      console.log("[API DEBUG] Using relative URL for remote access");
      return "/api";
    }
  }
  console.log("[API DEBUG] SSR fallback URL");
  return "http://localhost:3000/api";
}
const API_BASE = getApiBase();
function normalizeResponse(response) {
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  return response;
}
async function apiCall(endpoint, options) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers
      }
    });
    if (!response.ok) {
      let errorMessage = `API error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {
        }
      }
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Your session has expired. Please log in again.");
      } else if (response.status === 403) {
        throw new Error("You do not have permission to access this resource.");
      } else if (response.status === 404) {
        throw new Error("The requested resource was not found.");
      } else if (response.status === 409) {
        throw new Error(errorMessage !== `API error (409)` ? errorMessage : "This item already exists or there was a conflict.");
      } else if (response.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
      throw new Error(errorMessage);
    }
    if (response.status === 204) {
      return null;
    }
    const data = await response.json();
    const normalized = normalizeResponse(data);
    return normalized;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection and try again.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred. Please try again.");
  }
}
const tripsApi = {
  getAll: (filter = "upcoming") => apiCall(`/v1/trips?filter=${filter}`),
  getOne: (id) => apiCall(`/v1/trips/${id}`),
  create: (data) => apiCall("/v1/trips", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/v1/trips/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/v1/trips/${id}`, {
    method: "DELETE"
  })
};
const itemCompanionsApi = {
  update: (itemType, itemId, companionIds) => apiCall(`/v1/item-companions/${itemType}/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ companionIds })
  })
};
const initialState = {
  // Data
  trips: [],
  standaloneItems: {
    flights: [],
    hotels: [],
    transportation: [],
    carRentals: [],
    events: []
  },
  // Filtering
  activeTab: "upcoming",
  filteredItems: [],
  // UI State
  activeView: "trips",
  expandedTrips: /* @__PURE__ */ new Set(),
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
    carRentals: []
  },
  highlightedTripId: null,
  highlightedItemId: null,
  highlightedItemType: null,
  // Grouping
  groupedItems: {},
  dateKeysInOrder: [],
  // Loading/Error
  loading: false,
  error: null
};
const dashboardStore = writable(initialState);
derived(
  dashboardStore,
  ($store) => {
    const now = /* @__PURE__ */ new Date();
    now.setHours(0, 0, 0, 0);
    return $store.trips.filter((t) => new Date(t.departureDate) >= now).length;
  }
);
derived(
  dashboardStore,
  ($store) => {
    const now = /* @__PURE__ */ new Date();
    now.setHours(0, 0, 0, 0);
    return $store.trips.filter((t) => {
      const endDate = new Date(t.returnDate || t.departureDate);
      return endDate < now;
    }).length;
  }
);
derived(
  dashboardStore,
  ($store) => $store.secondarySidebarContent !== null || $store.tertiarySidebarContent !== null
);
derived(
  dashboardStore,
  ($store) => $store.secondarySidebarContent !== null
);
derived(
  dashboardStore,
  ($store) => $store.tertiarySidebarContent !== null
);
const dashboardStoreActions = {
  /**
   * TRIP DATA MANAGEMENT
   */
  /**
   * Set all trips (used after data load)
   */
  setTrips(trips) {
    dashboardStore.update((state) => ({
      ...state,
      trips
    }));
  },
  /**
   * Add a single trip
   */
  addTrip(trip) {
    dashboardStore.update((state) => ({
      ...state,
      trips: [...state.trips, trip]
    }));
  },
  /**
   * Update a trip by ID
   */
  updateTrip(id, data) {
    dashboardStore.update((state) => ({
      ...state,
      trips: state.trips.map((t) => t.id === id ? { ...t, ...data } : t)
    }));
  },
  /**
   * Delete a trip by ID (also closes any related sidebars)
   */
  deleteTrip(id) {
    dashboardStore.update((state) => {
      const newExpandedTrips = /* @__PURE__ */ new Set([...state.expandedTrips]);
      newExpandedTrips.delete(id);
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
        tertiarySidebarContent: newTertiarySidebar
      };
    });
  },
  /**
   * STANDALONE ITEMS MANAGEMENT
   */
  /**
   * Set all standalone items
   */
  setStandaloneItems(items) {
    dashboardStore.update((state) => ({
      ...state,
      standaloneItems: items
    }));
  },
  /**
   * Add a single standalone item
   */
  addStandaloneItem(itemType, item) {
    dashboardStore.update((state) => {
      const itemsKey = `${itemType}s`;
      return {
        ...state,
        standaloneItems: {
          ...state.standaloneItems,
          [itemsKey]: [...state.standaloneItems[itemsKey], item]
        }
      };
    });
  },
  /**
   * Delete a standalone item
   */
  deleteStandaloneItem(itemType, itemId) {
    dashboardStore.update((state) => {
      const itemsKey = `${itemType}s`;
      return {
        ...state,
        standaloneItems: {
          ...state.standaloneItems,
          [itemsKey]: state.standaloneItems[itemsKey].filter((item) => item.id !== itemId)
        }
      };
    });
  },
  /**
   * FILTERING
   */
  /**
   * Set active tab (upcoming or past)
   */
  setActiveTab(tab) {
    dashboardStore.update((state) => ({
      ...state,
      activeTab: tab,
      // Close secondary sidebar when switching tabs
      secondarySidebarContent: null
    }));
  },
  /**
   * Set filtered items (after filtering/grouping in +page.svelte)
   */
  setFilteredItems(items) {
    dashboardStore.update((state) => ({
      ...state,
      filteredItems: items
    }));
  },
  /**
   * Set grouped items and date keys (after grouping by date)
   */
  setGroupedItems(grouped, dateKeys) {
    dashboardStore.update((state) => ({
      ...state,
      groupedItems: grouped,
      dateKeysInOrder: dateKeys
    }));
  },
  /**
   * UI STATE
   */
  /**
   * Set active view (trips or settings)
   */
  setActiveView(view) {
    dashboardStore.update((state) => ({
      ...state,
      activeView: view
    }));
  },
  /**
   * Toggle trip expansion (show/hide items)
   */
  toggleTripExpanded(tripId) {
    dashboardStore.update((state) => {
      const newExpanded = new Set(state.expandedTrips);
      if (newExpanded.has(tripId)) {
        newExpanded.delete(tripId);
      } else {
        newExpanded.add(tripId);
      }
      return {
        ...state,
        expandedTrips: newExpanded
      };
    });
  },
  /**
   * Set which trip is expanded (direct set, not toggle)
   */
  setExpandedTrips(tripIds) {
    dashboardStore.update((state) => ({
      ...state,
      expandedTrips: tripIds
    }));
  },
  /**
   * Set new item menu visibility
   */
  setShowNewItemMenu(show) {
    dashboardStore.update((state) => ({
      ...state,
      showNewItemMenu: show
    }));
  },
  /**
   * SIDEBAR MANAGEMENT
   */
  /**
   * Open secondary sidebar with content
   */
  openSecondarySidebar(content) {
    dashboardStore.update((state) => ({
      ...state,
      secondarySidebarContent: content,
      showNewItemMenu: false
    }));
  },
  /**
   * Close secondary sidebar
   */
  closeSecondarySidebar() {
    dashboardStore.update((state) => ({
      ...state,
      secondarySidebarContent: null,
      showNewItemMenu: false
    }));
  },
  /**
   * Open tertiary sidebar with content
   */
  openTertiarySidebar(content) {
    dashboardStore.update((state) => ({
      ...state,
      tertiarySidebarContent: content
    }));
  },
  /**
   * Close tertiary sidebar
   */
  closeTertiarySidebar() {
    dashboardStore.update((state) => ({
      ...state,
      tertiarySidebarContent: null
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
      showNewItemMenu: false
    }));
  },
  /**
   * MAP HIGHLIGHTING
   */
  /**
   * Set highlighted trip for map
   */
  setHighlightedTrip(tripId) {
    dashboardStore.update((state) => ({
      ...state,
      highlightedTripId: tripId
    }));
  },
  /**
   * Set highlighted item for map
   */
  setHighlightedItem(itemId, itemType) {
    dashboardStore.update((state) => ({
      ...state,
      highlightedItemId: itemId,
      highlightedItemType: itemType
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
      highlightedItemType: null
    }));
  },
  /**
   * Set map data
   */
  setMapData(mapData) {
    dashboardStore.update((state) => ({
      ...state,
      mapData
    }));
  },
  /**
   * LOADING & ERROR STATE
   */
  /**
   * Set loading state
   */
  setLoading(loading) {
    dashboardStore.update((state) => ({
      ...state,
      loading
    }));
  },
  /**
   * Set error message
   */
  setError(error) {
    dashboardStore.update((state) => ({
      ...state,
      error
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
      activeTab: "upcoming",
      activeView: "trips",
      expandedTrips: /* @__PURE__ */ new Set(),
      showNewItemMenu: false,
      secondarySidebarContent: null,
      tertiarySidebarContent: null,
      highlightedTripId: null,
      highlightedItemId: null,
      highlightedItemType: null,
      error: null
    }));
  }
};
function utcToLocalTimeString(utcDateString, timezone) {
  if (!utcDateString) return "";
  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return "";
    if (!timezone) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone
    });
    const parts = formatter.formatToParts(date);
    const values = {};
    parts.forEach((part) => {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    });
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  } catch (error) {
    console.error("Error converting UTC to local time:", error);
    return "";
  }
}
Loading[FILENAME] = "src/lib/components/Loading.svelte";
function Loading($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let size = fallback($$props["size"], "medium");
      let message = fallback($$props["message"], "Loading...");
      $$renderer2.push(`<div${attr_class(`loading-container loading-${stringify(size)}`, "svelte-1a5pdw0")}>`);
      push_element($$renderer2, "div", 6, 0);
      $$renderer2.push(`<div class="spinner svelte-1a5pdw0">`);
      push_element($$renderer2, "div", 7, 2);
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      if (message) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="loading-message svelte-1a5pdw0">`);
        push_element($$renderer2, "p", 9, 4);
        $$renderer2.push(`${escape_html(message)}</p>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { size, message });
    },
    Loading
  );
}
Loading.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
AirportAutocomplete[FILENAME] = "src/lib/components/AirportAutocomplete.svelte";
function AirportAutocomplete($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let value = fallback($$props["value"], "");
      let placeholder = fallback($$props["placeholder"], "");
      let onSelect = fallback($$props["onSelect"], (airport) => {
      });
      $$renderer2.push(`<div class="autocomplete-container svelte-zauskz">`);
      push_element($$renderer2, "div", 103, 0);
      $$renderer2.push(`<input type="text"${attr("value", value)}${attr("placeholder", placeholder)} style="text-transform: uppercase;" class="svelte-zauskz"/>`);
      push_element($$renderer2, "input", 104, 2);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { value, placeholder, onSelect });
    },
    AirportAutocomplete
  );
}
AirportAutocomplete.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
ItemCompanionsForm[FILENAME] = "src/lib/components/ItemCompanionsForm.svelte";
function ItemCompanionsForm($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let companions = fallback($$props["companions"], () => [], true);
      let onCompanionsUpdate = fallback($$props["onCompanionsUpdate"], null);
      let onAddCompanion = fallback($$props["onAddCompanion"], null);
      let onRemoveCompanion = fallback($$props["onRemoveCompanion"], null);
      let searchInput = "";
      let loading = false;
      function getCompanionDisplayName(comp) {
        const data = comp.companion || comp;
        if (data.firstName && data.lastName) {
          return `${data.firstName} ${data.lastName}`;
        } else if (data.firstName) {
          return data.firstName;
        } else if (data.lastName) {
          return data.lastName;
        }
        return data.email;
      }
      $$renderer2.push(`<div class="companions-form svelte-1s09zii">`);
      push_element($$renderer2, "div", 156, 0);
      $$renderer2.push(`<h4 class="section-title svelte-1s09zii">`);
      push_element($$renderer2, "h4", 157, 2);
      $$renderer2.push(`Travel Companions</h4>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="search-container svelte-1s09zii">`);
      push_element($$renderer2, "div", 164, 2);
      $$renderer2.push(`<div class="search-box svelte-1s09zii">`);
      push_element($$renderer2, "div", 165, 4);
      $$renderer2.push(`<input type="text" placeholder="Search companions by name or email..."${attr("value", searchInput)}${attr("disabled", loading, true)} class="search-input svelte-1s09zii"/>`);
      push_element($$renderer2, "input", 166, 6);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      if (companions && companions.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="companions-list svelte-1s09zii">`);
        push_element($$renderer2, "div", 215, 4);
        $$renderer2.push(`<div class="list-header svelte-1s09zii">`);
        push_element($$renderer2, "div", 216, 6);
        $$renderer2.push(`<span>`);
        push_element($$renderer2, "span", 217, 8);
        $$renderer2.push(`Name</span>`);
        pop_element();
        $$renderer2.push(` <span class="action-col svelte-1s09zii">`);
        push_element($$renderer2, "span", 218, 8);
        $$renderer2.push(`</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <!--[-->`);
        const each_array_1 = ensure_array_like(companions);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let companion = each_array_1[$$index_1];
          $$renderer2.push(`<div class="companion-item svelte-1s09zii">`);
          push_element($$renderer2, "div", 221, 8);
          $$renderer2.push(`<div class="companion-info svelte-1s09zii">`);
          push_element($$renderer2, "div", 222, 10);
          $$renderer2.push(`<span class="companion-name svelte-1s09zii">`);
          push_element($$renderer2, "span", 223, 12);
          $$renderer2.push(`${escape_html(getCompanionDisplayName(companion))}</span>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(` <button class="remove-btn svelte-1s09zii"${attr("disabled", loading, true)} title="Remove companion">`);
          push_element($$renderer2, "button", 225, 10);
          $$renderer2.push(`✕</button>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<p class="no-companions svelte-1s09zii">`);
        push_element($$renderer2, "p", 237, 4);
        $$renderer2.push(`No companions added yet</p>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, {
        companions,
        onCompanionsUpdate,
        onAddCompanion,
        onRemoveCompanion
      });
    },
    ItemCompanionsForm
  );
}
ItemCompanionsForm.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
TripCompanionsForm[FILENAME] = "src/lib/components/TripCompanionsForm.svelte";
function TripCompanionsForm($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let tripId = $$props["tripId"];
      let companions = fallback($$props["companions"], () => [], true);
      let onCompanionsUpdate = fallback($$props["onCompanionsUpdate"], null);
      let searchInput = "";
      let loading = false;
      function getCompanionDisplayName(comp) {
        const data = comp.companion || comp;
        if (data.firstName && data.lastName) {
          return `${data.firstName} ${data.lastName}`;
        } else if (data.firstName) {
          return data.firstName;
        } else if (data.lastName) {
          return data.lastName;
        }
        return data.email;
      }
      $$renderer2.push(`<div class="trip-companions-form svelte-2ng4py">`);
      push_element($$renderer2, "div", 162, 0);
      $$renderer2.push(`<h4 class="section-title svelte-2ng4py">`);
      push_element($$renderer2, "h4", 163, 2);
      $$renderer2.push(`Travel Companions</h4>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="search-container svelte-2ng4py">`);
      push_element($$renderer2, "div", 170, 2);
      $$renderer2.push(`<div class="search-box svelte-2ng4py">`);
      push_element($$renderer2, "div", 171, 4);
      $$renderer2.push(`<input type="text" placeholder="Search companions by name or email..."${attr("value", searchInput)}${attr("disabled", loading, true)} class="search-input svelte-2ng4py"/>`);
      push_element($$renderer2, "input", 172, 6);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      if (companions && companions.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="companions-list svelte-2ng4py">`);
        push_element($$renderer2, "div", 221, 4);
        $$renderer2.push(`<div class="list-header svelte-2ng4py">`);
        push_element($$renderer2, "div", 222, 6);
        $$renderer2.push(`<span>`);
        push_element($$renderer2, "span", 223, 8);
        $$renderer2.push(`Name</span>`);
        pop_element();
        $$renderer2.push(` <span class="permission-col svelte-2ng4py">`);
        push_element($$renderer2, "span", 224, 8);
        $$renderer2.push(`Can Edit</span>`);
        pop_element();
        $$renderer2.push(` <span class="action-col svelte-2ng4py">`);
        push_element($$renderer2, "span", 225, 8);
        $$renderer2.push(`</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <!--[-->`);
        const each_array_1 = ensure_array_like(companions);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let companion = each_array_1[$$index_1];
          $$renderer2.push(`<div class="companion-item svelte-2ng4py">`);
          push_element($$renderer2, "div", 228, 8);
          $$renderer2.push(`<div class="companion-info svelte-2ng4py">`);
          push_element($$renderer2, "div", 229, 10);
          $$renderer2.push(`<span class="companion-name svelte-2ng4py">`);
          push_element($$renderer2, "span", 230, 12);
          $$renderer2.push(`${escape_html(getCompanionDisplayName(companion))}</span>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(` <div class="permission-cell svelte-2ng4py">`);
          push_element($$renderer2, "div", 232, 10);
          $$renderer2.push(`<input type="checkbox"${attr("checked", companion.canEdit, true)}${attr("disabled", loading, true)}${attr("title", companion.canEdit ? "Click to make view-only" : "Click to allow editing")} class="permission-checkbox svelte-2ng4py"/>`);
          push_element($$renderer2, "input", 233, 12);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(` <button class="remove-btn svelte-2ng4py"${attr("disabled", loading, true)} title="Remove companion">`);
          push_element($$renderer2, "button", 242, 10);
          $$renderer2.push(`✕</button>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<p class="no-companions svelte-2ng4py">`);
        push_element($$renderer2, "p", 254, 4);
        $$renderer2.push(`No companions added yet</p>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { tripId, companions, onCompanionsUpdate });
    },
    TripCompanionsForm
  );
}
TripCompanionsForm.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
ItemEditForm[FILENAME] = "src/lib/components/ItemEditForm.svelte";
function ItemEditForm($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let isEditing, showTripSelector, upcomingTrips, config;
      let itemType = $$props["itemType"];
      let data = fallback($$props["data"], null);
      let tripId = fallback($$props["tripId"], "");
      let allTrips = fallback($$props["allTrips"], () => [], true);
      let onClose = fallback($$props["onClose"], () => {
      });
      let onSave = fallback($$props["onSave"], () => {
      });
      let loading = false;
      function parseLocalDate2(dateString) {
        if (!dateString) return /* @__PURE__ */ new Date(0);
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      function initializeFormData(sourceData) {
        if (!sourceData) return {};
        const formData2 = { ...sourceData };
        if (itemType === "flight" && sourceData.departureDateTime) {
          const depDateTimeStr = utcToLocalTimeString(sourceData.departureDateTime, sourceData.originTimezone);
          if (depDateTimeStr) {
            const [date, time] = depDateTimeStr.split("T");
            formData2.departureDate = date;
            formData2.departureTime = time;
          }
          if (sourceData.arrivalDateTime) {
            const arrDateTimeStr = utcToLocalTimeString(sourceData.arrivalDateTime, sourceData.destinationTimezone);
            if (arrDateTimeStr) {
              const [date, time] = arrDateTimeStr.split("T");
              formData2.arrivalDate = date;
              formData2.arrivalTime = time;
            }
          }
        }
        if (itemType === "hotel" && sourceData.checkInDateTime) {
          const checkInStr = utcToLocalTimeString(sourceData.checkInDateTime, sourceData.timezone);
          if (checkInStr) {
            const [date, time] = checkInStr.split("T");
            formData2.checkInDate = date;
            formData2.checkInTime = time;
          }
          if (sourceData.checkOutDateTime) {
            const checkOutStr = utcToLocalTimeString(sourceData.checkOutDateTime, sourceData.timezone);
            if (checkOutStr) {
              const [date, time] = checkOutStr.split("T");
              formData2.checkOutDate = date;
              formData2.checkOutTime = time;
            }
          }
        }
        if (itemType === "hotel" && sourceData.hotelName && !sourceData.name) {
          formData2.name = sourceData.hotelName;
        }
        if (itemType === "event" && sourceData.startDateTime) {
          const startStr = utcToLocalTimeString(sourceData.startDateTime, sourceData.timezone);
          if (startStr) {
            const [date, time] = startStr.split("T");
            formData2.startDate = date;
            formData2.startTime = time;
          }
          if (sourceData.endDateTime) {
            const endStr = utcToLocalTimeString(sourceData.endDateTime, sourceData.timezone);
            if (endStr) {
              const [date, time] = endStr.split("T");
              formData2.endDate = date;
              formData2.endTime = time;
            }
          }
          if (formData2.startTime === "00:00" && formData2.endTime === "23:59") {
            formData2.allDay = true;
          }
        }
        if (itemType === "transportation" && sourceData.departureDateTime) {
          const depStr = utcToLocalTimeString(sourceData.departureDateTime, sourceData.originTimezone);
          if (depStr) {
            const [date, time] = depStr.split("T");
            formData2.departureDate = date;
            formData2.departureTime = time;
          }
          if (sourceData.arrivalDateTime) {
            const arrStr = utcToLocalTimeString(sourceData.arrivalDateTime, sourceData.destinationTimezone);
            if (arrStr) {
              const [date, time] = arrStr.split("T");
              formData2.arrivalDate = date;
              formData2.arrivalTime = time;
            }
          }
        }
        if (itemType === "carRental" && sourceData.pickupDateTime) {
          const pickupStr = utcToLocalTimeString(sourceData.pickupDateTime, sourceData.pickupTimezone);
          if (pickupStr) {
            const [date, time] = pickupStr.split("T");
            formData2.pickupDate = date;
            formData2.pickupTime = time;
          }
          if (sourceData.dropoffDateTime) {
            const dropoffStr = utcToLocalTimeString(sourceData.dropoffDateTime, sourceData.dropoffTimezone);
            if (dropoffStr) {
              const [date, time] = dropoffStr.split("T");
              formData2.dropoffDate = date;
              formData2.dropoffTime = time;
            }
          }
        }
        return formData2;
      }
      let formData = initializeFormData(data);
      let selectedTripId = "";
      let selectedCompanions = [];
      function getFormConfigs() {
        return {
          trip: {
            title: isEditing ? "Edit Trip" : "Add Trip",
            fields: [
              {
                name: "name",
                label: "Trip Name",
                type: "text",
                required: true,
                placeholder: "Summer Vacation"
              },
              {
                name: "purpose",
                label: "Purpose",
                type: "select",
                options: [
                  { value: "leisure", label: "Leisure" },
                  { value: "business", label: "Business" },
                  { value: "family", label: "Family" },
                  { value: "romantic", label: "Romantic" },
                  { value: "adventure", label: "Adventure" }
                ],
                required: true
              },
              {
                name: "departureDate",
                label: "Departure Date",
                type: "date",
                required: true
              },
              {
                name: "returnDate",
                label: "Return Date",
                type: "date",
                required: true
              },
              { name: "notes", label: "Notes", type: "textarea" }
            ]
          },
          flight: {
            title: isEditing ? "Edit Flight" : "Add Flight",
            fields: [
              {
                name: "flightNumber",
                label: "Flight Number",
                type: "text",
                required: true,
                placeholder: "KL668"
              },
              {
                name: "airline",
                label: "Airline",
                type: "text",
                readonly: true
              },
              {
                name: "origin",
                label: "Origin",
                type: "airport",
                required: true,
                placeholder: "AUS"
              },
              {
                name: "destination",
                label: "Destination",
                type: "airport",
                required: true,
                placeholder: "AMS"
              },
              {
                name: "departureDate",
                label: "Departure Date",
                type: "date",
                required: true
              },
              {
                name: "departureTime",
                label: "Departure Time",
                type: "time",
                required: true,
                placeholder: "HH:MM"
              },
              {
                name: "arrivalDate",
                label: "Arrival Date",
                type: "date",
                required: true
              },
              {
                name: "arrivalTime",
                label: "Arrival Time",
                type: "time",
                required: true,
                placeholder: "HH:MM"
              },
              {
                name: "pnr",
                label: "PNR",
                type: "text",
                placeholder: "ABC123D"
              },
              { name: "seat", label: "Seat", type: "text", placeholder: "4A" }
            ]
          },
          hotel: {
            title: isEditing ? "Edit Hotel" : "Add Hotel",
            fields: [
              {
                name: "name",
                label: "Hotel Name",
                type: "text",
                required: true
              },
              {
                name: "address",
                label: "Address",
                type: "text",
                required: true
              },
              {
                name: "checkInDate",
                label: "Check In Date",
                type: "date",
                required: true
              },
              {
                name: "checkInTime",
                label: "Check In Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "checkOutDate",
                label: "Check Out Date",
                type: "date",
                required: true
              },
              {
                name: "checkOutTime",
                label: "Check Out Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "confirmationNumber",
                label: "Confirmation Number",
                type: "text"
              },
              { name: "notes", label: "Notes", type: "textarea" }
            ]
          },
          transportation: {
            title: isEditing ? "Edit Transportation" : "Add Transportation",
            fields: [
              {
                name: "method",
                label: "Method",
                type: "select",
                options: [
                  { value: "train", label: "Train" },
                  { value: "bus", label: "Bus" },
                  { value: "ferry", label: "Ferry" },
                  { value: "shuttle", label: "Shuttle" },
                  { value: "taxi", label: "Taxi" },
                  { value: "rideshare", label: "Rideshare" },
                  { value: "subway", label: "Subway" },
                  { value: "metro", label: "Metro" },
                  { value: "tram", label: "Tram" },
                  { value: "other", label: "Other" }
                ],
                required: true
              },
              { name: "origin", label: "From", type: "text", required: true },
              {
                name: "destination",
                label: "To",
                type: "text",
                required: true
              },
              {
                name: "departureDate",
                label: "Departure Date",
                type: "date",
                required: true
              },
              {
                name: "departureTime",
                label: "Departure Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "arrivalDate",
                label: "Arrival Date",
                type: "date",
                required: true
              },
              {
                name: "arrivalTime",
                label: "Arrival Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "bookingReference",
                label: "Booking Reference",
                type: "text"
              },
              { name: "notes", label: "Notes", type: "textarea" }
            ]
          },
          carRental: {
            title: isEditing ? "Edit Car Rental" : "Add Car Rental",
            fields: [
              {
                name: "company",
                label: "Company",
                type: "text",
                required: true
              },
              {
                name: "pickupLocation",
                label: "Pickup Location",
                type: "text",
                required: true
              },
              {
                name: "pickupDate",
                label: "Pickup Date",
                type: "date",
                required: true
              },
              {
                name: "pickupTime",
                label: "Pickup Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "dropoffLocation",
                label: "Dropoff Location",
                type: "text",
                required: true
              },
              {
                name: "dropoffDate",
                label: "Dropoff Date",
                type: "date",
                required: true
              },
              {
                name: "dropoffTime",
                label: "Dropoff Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "confirmationNumber",
                label: "Confirmation Number",
                type: "text"
              },
              { name: "notes", label: "Notes", type: "textarea" }
            ]
          },
          event: {
            title: isEditing ? "Edit Event" : "Add Event",
            fields: [
              {
                name: "name",
                label: "Event Name",
                type: "text",
                required: true
              },
              {
                name: "location",
                label: "Location",
                type: "text",
                required: true
              },
              {
                name: "startDate",
                label: "Start Date",
                type: "date",
                required: true
              },
              { name: "endDate", label: "End Date", type: "date" },
              { name: "allDay", label: "All Day Event", type: "checkbox" },
              {
                name: "startTime",
                label: "Start Time",
                type: "time",
                placeholder: "HH:MM"
              },
              {
                name: "endTime",
                label: "End Time",
                type: "time",
                placeholder: "HH:MM"
              },
              { name: "description", label: "Description", type: "textarea" },
              { name: "ticketNumber", label: "Ticket Number", type: "text" },
              { name: "notes", label: "Notes", type: "textarea" }
            ]
          }
        };
      }
      function getItemIcon(type) {
        const iconMap = {
          trip: "flight_takeoff",
          flight: "flight",
          hotel: "hotel",
          event: "event",
          transportation: "directions_car",
          carRental: "directions_car",
          voucher: "card_giftcard"
        };
        return iconMap[type] || "info";
      }
      isEditing = !!data?.id;
      showTripSelector = itemType !== "trip";
      upcomingTrips = allTrips.filter((trip) => {
        const now = /* @__PURE__ */ new Date();
        now.setHours(0, 0, 0, 0);
        const tripDate = trip.departureDate ? parseLocalDate2(trip.departureDate) : null;
        return tripDate && tripDate >= now;
      });
      if (data) {
        const initialized = initializeFormData(data);
        formData = initialized;
        selectedTripId = data?.tripId || "";
        selectedCompanions = data?.itemCompanions || data?.travelCompanions || [];
      }
      config = getFormConfigs()[itemType];
      let $$settled = true;
      let $$inner_renderer;
      function $$render_inner($$renderer3) {
        $$renderer3.push(`<div class="edit-panel">`);
        push_element($$renderer3, "div", 486, 0);
        $$renderer3.push(`<div class="edit-header">`);
        push_element($$renderer3, "div", 487, 2);
        $$renderer3.push(`<div class="header-left">`);
        push_element($$renderer3, "div", 488, 4);
        $$renderer3.push(`<button class="back-btn">`);
        push_element($$renderer3, "button", 489, 6);
        $$renderer3.push(`<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        push_element($$renderer3, "svg", 490, 8);
        $$renderer3.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7">`);
        push_element($$renderer3, "path", 491, 10);
        $$renderer3.push(`</path>`);
        pop_element();
        $$renderer3.push(`</svg>`);
        pop_element();
        $$renderer3.push(`</button>`);
        pop_element();
        $$renderer3.push(` <h3>`);
        push_element($$renderer3, "h3", 494, 6);
        $$renderer3.push(`${escape_html(config.title)}</h3>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
        $$renderer3.push(` <div class="icon-badge"${attr("data-type", itemType)}>`);
        push_element($$renderer3, "div", 496, 4);
        $$renderer3.push(`<span class="material-symbols-outlined">`);
        push_element($$renderer3, "span", 497, 6);
        $$renderer3.push(`${escape_html(getItemIcon(itemType))}</span>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
        $$renderer3.push(` <form class="edit-content">`);
        push_element($$renderer3, "form", 501, 2);
        {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> <div class="form-fields">`);
        push_element($$renderer3, "div", 506, 4);
        if (showTripSelector) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="form-group">`);
          push_element($$renderer3, "div", 508, 8);
          $$renderer3.push(`<label for="tripSelector">`);
          push_element($$renderer3, "label", 509, 10);
          $$renderer3.push(`Trip</label>`);
          pop_element();
          $$renderer3.push(` `);
          $$renderer3.select({ id: "tripSelector", value: selectedTripId }, ($$renderer4) => {
            $$renderer4.option({ value: "" }, ($$renderer5) => {
              $$renderer5.push(`Standalone Item`);
            });
            $$renderer4.push(`<!--[-->`);
            const each_array = ensure_array_like(upcomingTrips);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let trip = each_array[$$index];
              $$renderer4.option({ value: trip.id }, ($$renderer5) => {
                $$renderer5.push(`${escape_html(trip.name)}`);
              });
            }
            $$renderer4.push(`<!--]-->`);
          });
          $$renderer3.push(`</div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (itemType === "flight") {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="form-row cols-3">`);
          push_element($$renderer3, "div", 520, 8);
          $$renderer3.push(`<div class="form-group">`);
          push_element($$renderer3, "div", 521, 10);
          $$renderer3.push(`<label for="flightNumber">`);
          push_element($$renderer3, "label", 522, 12);
          $$renderer3.push(`${escape_html(config.fields.find((f) => f.name === "flightNumber")?.label)}</label>`);
          pop_element();
          $$renderer3.push(` <input type="text" id="flightNumber" name="flightNumber"${attr("value", formData.flightNumber)} placeholder="KL668"/>`);
          push_element($$renderer3, "input", 523, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-group" style="grid-column: span 2;">`);
          push_element($$renderer3, "div", 532, 10);
          $$renderer3.push(`<label for="airline">`);
          push_element($$renderer3, "label", 533, 12);
          $$renderer3.push(`${escape_html(config.fields.find((f) => f.name === "airline")?.label)} `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--></label>`);
          pop_element();
          $$renderer3.push(` <input type="text" id="airline" name="airline"${attr("value", formData.airline)} readonly class="readonly"/>`);
          push_element($$renderer3, "input", 539, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-row cols-2">`);
          push_element($$renderer3, "div", 544, 8);
          $$renderer3.push(`<div class="form-group">`);
          push_element($$renderer3, "div", 545, 10);
          $$renderer3.push(`<label for="origin">`);
          push_element($$renderer3, "label", 546, 12);
          $$renderer3.push(`Origin</label>`);
          pop_element();
          $$renderer3.push(` `);
          AirportAutocomplete($$renderer3, {
            id: "origin",
            placeholder: "AUS",
            onSelect: (airport) => {
              formData.origin = airport.iata;
            },
            get value() {
              return formData.origin;
            },
            set value($$value) {
              formData.origin = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="form-group">`);
          push_element($$renderer3, "div", 556, 10);
          $$renderer3.push(`<label for="destination">`);
          push_element($$renderer3, "label", 557, 12);
          $$renderer3.push(`Destination</label>`);
          pop_element();
          $$renderer3.push(` `);
          AirportAutocomplete($$renderer3, {
            id: "destination",
            placeholder: "AMS",
            onSelect: (airport) => {
              formData.destination = airport.iata;
            },
            get value() {
              return formData.destination;
            },
            set value($$value) {
              formData.destination = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-row cols-2">`);
          push_element($$renderer3, "div", 570, 8);
          $$renderer3.push(`<div class="form-group">`);
          push_element($$renderer3, "div", 571, 10);
          $$renderer3.push(`<label for="departureDate">`);
          push_element($$renderer3, "label", 572, 12);
          $$renderer3.push(`Departure Date</label>`);
          pop_element();
          $$renderer3.push(` <input type="date" id="departureDate" name="departureDate"${attr("value", formData.departureDate)}/>`);
          push_element($$renderer3, "input", 573, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-group">`);
          push_element($$renderer3, "div", 575, 10);
          $$renderer3.push(`<label for="departureTime">`);
          push_element($$renderer3, "label", 576, 12);
          $$renderer3.push(`Departure Time</label>`);
          pop_element();
          $$renderer3.push(` <input type="text" id="departureTime" name="departureTime"${attr("value", formData.departureTime)} placeholder="HH:MM" maxlength="5"/>`);
          push_element($$renderer3, "input", 577, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-row cols-2">`);
          push_element($$renderer3, "div", 582, 8);
          $$renderer3.push(`<div class="form-group">`);
          push_element($$renderer3, "div", 583, 10);
          $$renderer3.push(`<label for="arrivalDate">`);
          push_element($$renderer3, "label", 584, 12);
          $$renderer3.push(`Arrival Date</label>`);
          pop_element();
          $$renderer3.push(` <input type="date" id="arrivalDate" name="arrivalDate"${attr("value", formData.arrivalDate)}/>`);
          push_element($$renderer3, "input", 585, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-group">`);
          push_element($$renderer3, "div", 587, 10);
          $$renderer3.push(`<label for="arrivalTime">`);
          push_element($$renderer3, "label", 588, 12);
          $$renderer3.push(`Arrival Time</label>`);
          pop_element();
          $$renderer3.push(` <input type="text" id="arrivalTime" name="arrivalTime"${attr("value", formData.arrivalTime)} placeholder="HH:MM" maxlength="5"/>`);
          push_element($$renderer3, "input", 589, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-row cols-3">`);
          push_element($$renderer3, "div", 594, 8);
          $$renderer3.push(`<div class="form-group" style="grid-column: span 2;">`);
          push_element($$renderer3, "div", 595, 10);
          $$renderer3.push(`<label for="pnr">`);
          push_element($$renderer3, "label", 596, 12);
          $$renderer3.push(`PNR</label>`);
          pop_element();
          $$renderer3.push(` <input type="text" id="pnr" name="pnr"${attr("value", formData.pnr)} placeholder="ABC123D"/>`);
          push_element($$renderer3, "input", 597, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="form-group">`);
          push_element($$renderer3, "div", 599, 10);
          $$renderer3.push(`<label for="seat">`);
          push_element($$renderer3, "label", 600, 12);
          $$renderer3.push(`Seat</label>`);
          pop_element();
          $$renderer3.push(` <input type="text" id="seat" name="seat"${attr("value", formData.seat)} placeholder="4A"/>`);
          push_element($$renderer3, "input", 601, 12);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
          if (itemType === "hotel") {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="form-group">`);
            push_element($$renderer3, "div", 606, 8);
            $$renderer3.push(`<label for="name">`);
            push_element($$renderer3, "label", 607, 10);
            $$renderer3.push(`Hotel Name</label>`);
            pop_element();
            $$renderer3.push(` <input type="text" id="name" name="name"${attr("value", formData.name)} placeholder="W Bangkok" required/>`);
            push_element($$renderer3, "input", 608, 10);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-group">`);
            push_element($$renderer3, "div", 612, 8);
            $$renderer3.push(`<label for="address">`);
            push_element($$renderer3, "label", 613, 10);
            $$renderer3.push(`Address</label>`);
            pop_element();
            $$renderer3.push(` <textarea id="address" name="address" placeholder="Full address">`);
            push_element($$renderer3, "textarea", 614, 10);
            const $$body = escape_html(formData.address);
            if ($$body) {
              $$renderer3.push(`${$$body}`);
            }
            $$renderer3.push(`</textarea>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-row cols-2">`);
            push_element($$renderer3, "div", 618, 8);
            $$renderer3.push(`<div class="form-group">`);
            push_element($$renderer3, "div", 619, 10);
            $$renderer3.push(`<label for="checkInDate">`);
            push_element($$renderer3, "label", 620, 12);
            $$renderer3.push(`Check-in Date</label>`);
            pop_element();
            $$renderer3.push(` <input type="date" id="checkInDate" name="checkInDate"${attr("value", formData.checkInDate)} required/>`);
            push_element($$renderer3, "input", 621, 12);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-group">`);
            push_element($$renderer3, "div", 623, 10);
            $$renderer3.push(`<label for="checkInTime">`);
            push_element($$renderer3, "label", 624, 12);
            $$renderer3.push(`Check-in Time</label>`);
            pop_element();
            $$renderer3.push(` <input type="text" id="checkInTime" name="checkInTime"${attr("value", formData.checkInTime)} placeholder="HH:MM" maxlength="5"/>`);
            push_element($$renderer3, "input", 625, 12);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-row cols-2">`);
            push_element($$renderer3, "div", 630, 8);
            $$renderer3.push(`<div class="form-group">`);
            push_element($$renderer3, "div", 631, 10);
            $$renderer3.push(`<label for="checkOutDate">`);
            push_element($$renderer3, "label", 632, 12);
            $$renderer3.push(`Check-out Date</label>`);
            pop_element();
            $$renderer3.push(` <input type="date" id="checkOutDate" name="checkOutDate"${attr("value", formData.checkOutDate)} required/>`);
            push_element($$renderer3, "input", 633, 12);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-group">`);
            push_element($$renderer3, "div", 635, 10);
            $$renderer3.push(`<label for="checkOutTime">`);
            push_element($$renderer3, "label", 636, 12);
            $$renderer3.push(`Check-out Time</label>`);
            pop_element();
            $$renderer3.push(` <input type="text" id="checkOutTime" name="checkOutTime"${attr("value", formData.checkOutTime)} placeholder="HH:MM" maxlength="5"/>`);
            push_element($$renderer3, "input", 637, 12);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-group">`);
            push_element($$renderer3, "div", 642, 8);
            $$renderer3.push(`<label for="confirmationNumber">`);
            push_element($$renderer3, "label", 643, 10);
            $$renderer3.push(`Confirmation Number</label>`);
            pop_element();
            $$renderer3.push(` <input type="text" id="confirmationNumber" name="confirmationNumber"${attr("value", formData.confirmationNumber)}/>`);
            push_element($$renderer3, "input", 644, 10);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="form-group">`);
            push_element($$renderer3, "div", 648, 8);
            $$renderer3.push(`<label for="notes">`);
            push_element($$renderer3, "label", 649, 10);
            $$renderer3.push(`Notes</label>`);
            pop_element();
            $$renderer3.push(` <textarea id="notes" name="notes" placeholder="Additional information">`);
            push_element($$renderer3, "textarea", 650, 10);
            const $$body_1 = escape_html(formData.notes);
            if ($$body_1) {
              $$renderer3.push(`${$$body_1}`);
            }
            $$renderer3.push(`</textarea>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
          } else {
            $$renderer3.push("<!--[!-->");
            if (itemType === "transportation") {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="form-group">`);
              push_element($$renderer3, "div", 654, 8);
              $$renderer3.push(`<label for="method">`);
              push_element($$renderer3, "label", 655, 10);
              $$renderer3.push(`Method</label>`);
              pop_element();
              $$renderer3.push(` `);
              $$renderer3.select(
                {
                  id: "method",
                  name: "method",
                  value: formData.method,
                  required: true
                },
                ($$renderer4) => {
                  $$renderer4.option({ value: "" }, ($$renderer5) => {
                    $$renderer5.push(`Select Method`);
                  });
                  $$renderer4.push(`<!--[-->`);
                  const each_array_1 = ensure_array_like(config.fields.find((f) => f.name === "method")?.options || []);
                  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                    let option = each_array_1[$$index_1];
                    if (typeof option === "object" && option.value) {
                      $$renderer4.push("<!--[-->");
                      $$renderer4.option({ value: option.value }, ($$renderer5) => {
                        $$renderer5.push(`${escape_html(option.label)}`);
                      });
                    } else {
                      $$renderer4.push("<!--[!-->");
                      $$renderer4.option({ value: option }, ($$renderer5) => {
                        $$renderer5.push(`${escape_html(option)}`);
                      });
                    }
                    $$renderer4.push(`<!--]-->`);
                  }
                  $$renderer4.push(`<!--]-->`);
                }
              );
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-row cols-2">`);
              push_element($$renderer3, "div", 669, 8);
              $$renderer3.push(`<div class="form-group">`);
              push_element($$renderer3, "div", 670, 10);
              $$renderer3.push(`<label for="origin">`);
              push_element($$renderer3, "label", 671, 12);
              $$renderer3.push(`From</label>`);
              pop_element();
              $$renderer3.push(` <input type="text" id="origin" name="origin"${attr("value", formData.origin)} required/>`);
              push_element($$renderer3, "input", 672, 12);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-group">`);
              push_element($$renderer3, "div", 674, 10);
              $$renderer3.push(`<label for="destination">`);
              push_element($$renderer3, "label", 675, 12);
              $$renderer3.push(`To</label>`);
              pop_element();
              $$renderer3.push(` <input type="text" id="destination" name="destination"${attr("value", formData.destination)} required/>`);
              push_element($$renderer3, "input", 676, 12);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-row cols-2">`);
              push_element($$renderer3, "div", 681, 8);
              $$renderer3.push(`<div class="form-group">`);
              push_element($$renderer3, "div", 682, 10);
              $$renderer3.push(`<label for="departureDate">`);
              push_element($$renderer3, "label", 683, 12);
              $$renderer3.push(`Departure Date</label>`);
              pop_element();
              $$renderer3.push(` <input type="date" id="departureDate" name="departureDate"${attr("value", formData.departureDate)} required/>`);
              push_element($$renderer3, "input", 684, 12);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-group">`);
              push_element($$renderer3, "div", 686, 10);
              $$renderer3.push(`<label for="departureTime">`);
              push_element($$renderer3, "label", 687, 12);
              $$renderer3.push(`Departure Time</label>`);
              pop_element();
              $$renderer3.push(` <input type="text" id="departureTime" name="departureTime"${attr("value", formData.departureTime)} placeholder="HH:MM" maxlength="5"/>`);
              push_element($$renderer3, "input", 688, 12);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-row cols-2">`);
              push_element($$renderer3, "div", 693, 8);
              $$renderer3.push(`<div class="form-group">`);
              push_element($$renderer3, "div", 694, 10);
              $$renderer3.push(`<label for="arrivalDate">`);
              push_element($$renderer3, "label", 695, 12);
              $$renderer3.push(`Arrival Date</label>`);
              pop_element();
              $$renderer3.push(` <input type="date" id="arrivalDate" name="arrivalDate"${attr("value", formData.arrivalDate)} required/>`);
              push_element($$renderer3, "input", 696, 12);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-group">`);
              push_element($$renderer3, "div", 698, 10);
              $$renderer3.push(`<label for="arrivalTime">`);
              push_element($$renderer3, "label", 699, 12);
              $$renderer3.push(`Arrival Time</label>`);
              pop_element();
              $$renderer3.push(` <input type="text" id="arrivalTime" name="arrivalTime"${attr("value", formData.arrivalTime)} placeholder="HH:MM" maxlength="5"/>`);
              push_element($$renderer3, "input", 700, 12);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-group">`);
              push_element($$renderer3, "div", 705, 8);
              $$renderer3.push(`<label for="bookingReference">`);
              push_element($$renderer3, "label", 706, 10);
              $$renderer3.push(`Booking Reference</label>`);
              pop_element();
              $$renderer3.push(` <input type="text" id="bookingReference" name="bookingReference"${attr("value", formData.bookingReference)}/>`);
              push_element($$renderer3, "input", 707, 10);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
              $$renderer3.push(` <div class="form-group">`);
              push_element($$renderer3, "div", 710, 8);
              $$renderer3.push(`<label for="notes">`);
              push_element($$renderer3, "label", 711, 10);
              $$renderer3.push(`Notes</label>`);
              pop_element();
              $$renderer3.push(` <textarea id="notes" name="notes" placeholder="Additional information">`);
              push_element($$renderer3, "textarea", 712, 10);
              const $$body_2 = escape_html(formData.notes);
              if ($$body_2) {
                $$renderer3.push(`${$$body_2}`);
              }
              $$renderer3.push(`</textarea>`);
              pop_element();
              $$renderer3.push(`</div>`);
              pop_element();
            } else {
              $$renderer3.push("<!--[!-->");
              if (itemType === "carRental") {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`<div class="form-row cols-2">`);
                push_element($$renderer3, "div", 717, 8);
                $$renderer3.push(`<div class="form-group">`);
                push_element($$renderer3, "div", 718, 10);
                $$renderer3.push(`<label for="company">`);
                push_element($$renderer3, "label", 719, 12);
                $$renderer3.push(`Company</label>`);
                pop_element();
                $$renderer3.push(` <input type="text" id="company" name="company"${attr("value", formData.company)} required/>`);
                push_element($$renderer3, "input", 720, 12);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-group">`);
                push_element($$renderer3, "div", 722, 10);
                $$renderer3.push(`<label for="pickupLocation">`);
                push_element($$renderer3, "label", 723, 12);
                $$renderer3.push(`Pickup Location</label>`);
                pop_element();
                $$renderer3.push(` <input type="text" id="pickupLocation" name="pickupLocation"${attr("value", formData.pickupLocation)} required/>`);
                push_element($$renderer3, "input", 724, 12);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-row cols-2">`);
                push_element($$renderer3, "div", 729, 8);
                $$renderer3.push(`<div class="form-group">`);
                push_element($$renderer3, "div", 730, 10);
                $$renderer3.push(`<label for="pickupDate">`);
                push_element($$renderer3, "label", 731, 12);
                $$renderer3.push(`Pickup Date</label>`);
                pop_element();
                $$renderer3.push(` <input type="date" id="pickupDate" name="pickupDate"${attr("value", formData.pickupDate)} required/>`);
                push_element($$renderer3, "input", 732, 12);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-group">`);
                push_element($$renderer3, "div", 734, 10);
                $$renderer3.push(`<label for="pickupTime">`);
                push_element($$renderer3, "label", 735, 12);
                $$renderer3.push(`Pickup Time</label>`);
                pop_element();
                $$renderer3.push(` <input type="text" id="pickupTime" name="pickupTime"${attr("value", formData.pickupTime)} placeholder="HH:MM" maxlength="5"/>`);
                push_element($$renderer3, "input", 736, 12);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-group">`);
                push_element($$renderer3, "div", 741, 8);
                $$renderer3.push(`<label for="dropoffLocation">`);
                push_element($$renderer3, "label", 742, 10);
                $$renderer3.push(`Dropoff Location</label>`);
                pop_element();
                $$renderer3.push(` <input type="text" id="dropoffLocation" name="dropoffLocation"${attr("value", formData.dropoffLocation)} required/>`);
                push_element($$renderer3, "input", 743, 10);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-row cols-2">`);
                push_element($$renderer3, "div", 747, 8);
                $$renderer3.push(`<div class="form-group">`);
                push_element($$renderer3, "div", 748, 10);
                $$renderer3.push(`<label for="dropoffDate">`);
                push_element($$renderer3, "label", 749, 12);
                $$renderer3.push(`Dropoff Date</label>`);
                pop_element();
                $$renderer3.push(` <input type="date" id="dropoffDate" name="dropoffDate"${attr("value", formData.dropoffDate)} required/>`);
                push_element($$renderer3, "input", 750, 12);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-group">`);
                push_element($$renderer3, "div", 752, 10);
                $$renderer3.push(`<label for="dropoffTime">`);
                push_element($$renderer3, "label", 753, 12);
                $$renderer3.push(`Dropoff Time</label>`);
                pop_element();
                $$renderer3.push(` <input type="text" id="dropoffTime" name="dropoffTime"${attr("value", formData.dropoffTime)} placeholder="HH:MM" maxlength="5"/>`);
                push_element($$renderer3, "input", 754, 12);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-group">`);
                push_element($$renderer3, "div", 759, 8);
                $$renderer3.push(`<label for="confirmationNumber">`);
                push_element($$renderer3, "label", 760, 10);
                $$renderer3.push(`Confirmation Number</label>`);
                pop_element();
                $$renderer3.push(` <input type="text" id="confirmationNumber" name="confirmationNumber"${attr("value", formData.confirmationNumber)}/>`);
                push_element($$renderer3, "input", 761, 10);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
                $$renderer3.push(` <div class="form-group">`);
                push_element($$renderer3, "div", 764, 8);
                $$renderer3.push(`<label for="notes">`);
                push_element($$renderer3, "label", 765, 10);
                $$renderer3.push(`Notes</label>`);
                pop_element();
                $$renderer3.push(` <textarea id="notes" name="notes" placeholder="Additional information">`);
                push_element($$renderer3, "textarea", 766, 10);
                const $$body_3 = escape_html(formData.notes);
                if ($$body_3) {
                  $$renderer3.push(`${$$body_3}`);
                }
                $$renderer3.push(`</textarea>`);
                pop_element();
                $$renderer3.push(`</div>`);
                pop_element();
              } else {
                $$renderer3.push("<!--[!-->");
                if (itemType === "event") {
                  $$renderer3.push("<!--[-->");
                  $$renderer3.push(`<div class="form-group">`);
                  push_element($$renderer3, "div", 771, 8);
                  $$renderer3.push(`<label for="name">`);
                  push_element($$renderer3, "label", 772, 10);
                  $$renderer3.push(`Event Name</label>`);
                  pop_element();
                  $$renderer3.push(` <input type="text" id="name" name="name"${attr("value", formData.name)} required/>`);
                  push_element($$renderer3, "input", 773, 10);
                  pop_element();
                  $$renderer3.push(`</div>`);
                  pop_element();
                  $$renderer3.push(` <div class="form-group">`);
                  push_element($$renderer3, "div", 776, 8);
                  $$renderer3.push(`<label for="location">`);
                  push_element($$renderer3, "label", 777, 10);
                  $$renderer3.push(`Location</label>`);
                  pop_element();
                  $$renderer3.push(` <input type="text" id="location" name="location"${attr("value", formData.location)} required/>`);
                  push_element($$renderer3, "input", 778, 10);
                  pop_element();
                  $$renderer3.push(`</div>`);
                  pop_element();
                  $$renderer3.push(` <div class="form-group checkbox-group svelte-diniqf">`);
                  push_element($$renderer3, "div", 782, 8);
                  $$renderer3.push(`<label for="allDay" class="svelte-diniqf">`);
                  push_element($$renderer3, "label", 783, 10);
                  $$renderer3.push(`<input type="checkbox" id="allDay" name="allDay"${attr("checked", formData.allDay, true)} class="svelte-diniqf"/>`);
                  push_element($$renderer3, "input", 784, 12);
                  pop_element();
                  $$renderer3.push(` <span class="svelte-diniqf">`);
                  push_element($$renderer3, "span", 785, 12);
                  $$renderer3.push(`All Day Event</span>`);
                  pop_element();
                  $$renderer3.push(`</label>`);
                  pop_element();
                  $$renderer3.push(`</div>`);
                  pop_element();
                  $$renderer3.push(` `);
                  if (formData.allDay) {
                    $$renderer3.push("<!--[-->");
                    $$renderer3.push(`<div class="form-row cols-2">`);
                    push_element($$renderer3, "div", 791, 10);
                    $$renderer3.push(`<div class="form-group">`);
                    push_element($$renderer3, "div", 792, 12);
                    $$renderer3.push(`<label for="startDate">`);
                    push_element($$renderer3, "label", 793, 14);
                    $$renderer3.push(`Start Date</label>`);
                    pop_element();
                    $$renderer3.push(` <input type="date" id="startDate" name="startDate"${attr("value", formData.startDate)} required/>`);
                    push_element($$renderer3, "input", 794, 14);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(` <div class="form-group">`);
                    push_element($$renderer3, "div", 796, 12);
                    $$renderer3.push(`<label for="endDate">`);
                    push_element($$renderer3, "label", 797, 14);
                    $$renderer3.push(`End Date</label>`);
                    pop_element();
                    $$renderer3.push(` <input type="date" id="endDate" name="endDate"${attr("value", formData.endDate)}/>`);
                    push_element($$renderer3, "input", 798, 14);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                  } else {
                    $$renderer3.push("<!--[!-->");
                    $$renderer3.push(`<div class="form-row cols-2">`);
                    push_element($$renderer3, "div", 803, 10);
                    $$renderer3.push(`<div class="form-group">`);
                    push_element($$renderer3, "div", 804, 12);
                    $$renderer3.push(`<label for="startDate">`);
                    push_element($$renderer3, "label", 805, 14);
                    $$renderer3.push(`Start Date</label>`);
                    pop_element();
                    $$renderer3.push(` <input type="date" id="startDate" name="startDate"${attr("value", formData.startDate)} required/>`);
                    push_element($$renderer3, "input", 806, 14);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(` <div class="form-group">`);
                    push_element($$renderer3, "div", 808, 12);
                    $$renderer3.push(`<label for="startTime">`);
                    push_element($$renderer3, "label", 809, 14);
                    $$renderer3.push(`Start Time</label>`);
                    pop_element();
                    $$renderer3.push(` <input type="text" id="startTime" name="startTime"${attr("value", formData.startTime)} placeholder="HH:MM" maxlength="5"/>`);
                    push_element($$renderer3, "input", 810, 14);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(` <div class="form-row cols-2">`);
                    push_element($$renderer3, "div", 815, 10);
                    $$renderer3.push(`<div class="form-group">`);
                    push_element($$renderer3, "div", 816, 12);
                    $$renderer3.push(`<label for="endDate">`);
                    push_element($$renderer3, "label", 817, 14);
                    $$renderer3.push(`End Date</label>`);
                    pop_element();
                    $$renderer3.push(` <input type="date" id="endDate" name="endDate"${attr("value", formData.endDate)}/>`);
                    push_element($$renderer3, "input", 818, 14);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(` <div class="form-group">`);
                    push_element($$renderer3, "div", 820, 12);
                    $$renderer3.push(`<label for="endTime">`);
                    push_element($$renderer3, "label", 821, 14);
                    $$renderer3.push(`End Time</label>`);
                    pop_element();
                    $$renderer3.push(` <input type="text" id="endTime" name="endTime"${attr("value", formData.endTime)} placeholder="HH:MM" maxlength="5"/>`);
                    push_element($$renderer3, "input", 822, 14);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                    $$renderer3.push(`</div>`);
                    pop_element();
                  }
                  $$renderer3.push(`<!--]--> <div class="form-group">`);
                  push_element($$renderer3, "div", 828, 8);
                  $$renderer3.push(`<label for="ticketNumber">`);
                  push_element($$renderer3, "label", 829, 10);
                  $$renderer3.push(`Ticket Number</label>`);
                  pop_element();
                  $$renderer3.push(` <input type="text" id="ticketNumber" name="ticketNumber"${attr("value", formData.ticketNumber)}/>`);
                  push_element($$renderer3, "input", 830, 10);
                  pop_element();
                  $$renderer3.push(`</div>`);
                  pop_element();
                  $$renderer3.push(` <div class="form-group">`);
                  push_element($$renderer3, "div", 834, 8);
                  $$renderer3.push(`<label for="description">`);
                  push_element($$renderer3, "label", 835, 10);
                  $$renderer3.push(`Description</label>`);
                  pop_element();
                  $$renderer3.push(` <textarea id="description" name="description" placeholder="Event details">`);
                  push_element($$renderer3, "textarea", 836, 10);
                  const $$body_4 = escape_html(formData.description);
                  if ($$body_4) {
                    $$renderer3.push(`${$$body_4}`);
                  }
                  $$renderer3.push(`</textarea>`);
                  pop_element();
                  $$renderer3.push(`</div>`);
                  pop_element();
                  $$renderer3.push(` <div class="form-group">`);
                  push_element($$renderer3, "div", 839, 8);
                  $$renderer3.push(`<label for="notes">`);
                  push_element($$renderer3, "label", 840, 10);
                  $$renderer3.push(`Notes</label>`);
                  pop_element();
                  $$renderer3.push(` <textarea id="notes" name="notes" placeholder="Additional information">`);
                  push_element($$renderer3, "textarea", 841, 10);
                  const $$body_5 = escape_html(formData.notes);
                  if ($$body_5) {
                    $$renderer3.push(`${$$body_5}`);
                  }
                  $$renderer3.push(`</textarea>`);
                  pop_element();
                  $$renderer3.push(`</div>`);
                  pop_element();
                } else {
                  $$renderer3.push("<!--[!-->");
                  if (itemType === "trip" && config.fields.some((f) => f.name === "departureDate")) {
                    $$renderer3.push("<!--[-->");
                    $$renderer3.push(`<!--[-->`);
                    const each_array_2 = ensure_array_like(config.fields);
                    for (let $$index_4 = 0, $$length = each_array_2.length; $$index_4 < $$length; $$index_4++) {
                      let field = each_array_2[$$index_4];
                      if (field.name === "departureDate") {
                        $$renderer3.push("<!--[-->");
                        $$renderer3.push(`<div class="form-row cols-2">`);
                        push_element($$renderer3, "div", 850, 14);
                        $$renderer3.push(`<div class="form-group">`);
                        push_element($$renderer3, "div", 851, 16);
                        $$renderer3.push(`<label${attr("for", field.name)}>`);
                        push_element($$renderer3, "label", 852, 18);
                        $$renderer3.push(`${escape_html(field.label)}</label>`);
                        pop_element();
                        $$renderer3.push(` <input type="date"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("required", field.required, true)}/>`);
                        push_element($$renderer3, "input", 853, 18);
                        pop_element();
                        $$renderer3.push(`</div>`);
                        pop_element();
                        $$renderer3.push(` `);
                        if (config.fields.some((f) => f.name === "returnDate")) {
                          $$renderer3.push("<!--[-->");
                          $$renderer3.push(`<!--[-->`);
                          const each_array_3 = ensure_array_like(config.fields);
                          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
                            let returnField = each_array_3[$$index_2];
                            if (returnField.name === "returnDate") {
                              $$renderer3.push("<!--[-->");
                              $$renderer3.push(`<div class="form-group">`);
                              push_element($$renderer3, "div", 864, 22);
                              $$renderer3.push(`<label${attr("for", returnField.name)}>`);
                              push_element($$renderer3, "label", 865, 24);
                              $$renderer3.push(`${escape_html(returnField.label)}</label>`);
                              pop_element();
                              $$renderer3.push(` <input type="date"${attr("id", returnField.name)}${attr("name", returnField.name)}${attr("value", formData[returnField.name])}${attr("required", returnField.required, true)}/>`);
                              push_element($$renderer3, "input", 866, 24);
                              pop_element();
                              $$renderer3.push(`</div>`);
                              pop_element();
                            } else {
                              $$renderer3.push("<!--[!-->");
                            }
                            $$renderer3.push(`<!--]-->`);
                          }
                          $$renderer3.push(`<!--]-->`);
                        } else {
                          $$renderer3.push("<!--[!-->");
                        }
                        $$renderer3.push(`<!--]--></div>`);
                        pop_element();
                      } else {
                        $$renderer3.push("<!--[!-->");
                        if (field.name !== "returnDate") {
                          $$renderer3.push("<!--[-->");
                          $$renderer3.push(`<div class="form-group">`);
                          push_element($$renderer3, "div", 879, 14);
                          $$renderer3.push(`<label${attr("for", field.name)}>`);
                          push_element($$renderer3, "label", 880, 16);
                          $$renderer3.push(`${escape_html(field.label)}</label>`);
                          pop_element();
                          $$renderer3.push(` `);
                          if (field.type === "text") {
                            $$renderer3.push("<!--[-->");
                            $$renderer3.push(`<input type="text"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("placeholder", field.placeholder)}${attr("required", field.required, true)}${attr("readonly", field.readonly, true)}${attr_class(clsx(field.readonly ? "readonly" : ""))}/>`);
                            push_element($$renderer3, "input", 883, 18);
                            pop_element();
                          } else {
                            $$renderer3.push("<!--[!-->");
                            if (field.type === "date") {
                              $$renderer3.push("<!--[-->");
                              $$renderer3.push(`<input type="date"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("required", field.required, true)}/>`);
                              push_element($$renderer3, "input", 894, 18);
                              pop_element();
                            } else {
                              $$renderer3.push("<!--[!-->");
                              if (field.type === "time") {
                                $$renderer3.push("<!--[-->");
                                $$renderer3.push(`<input type="text"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("placeholder", field.placeholder)} maxlength="5"/>`);
                                push_element($$renderer3, "input", 902, 18);
                                pop_element();
                              } else {
                                $$renderer3.push("<!--[!-->");
                                if (field.type === "select") {
                                  $$renderer3.push("<!--[-->");
                                  $$renderer3.select(
                                    {
                                      id: field.name,
                                      name: field.name,
                                      value: formData[field.name],
                                      required: field.required
                                    },
                                    ($$renderer4) => {
                                      $$renderer4.option({ value: "" }, ($$renderer5) => {
                                        $$renderer5.push(`Select ${escape_html(field.label)}`);
                                      });
                                      $$renderer4.push(`<!--[-->`);
                                      const each_array_4 = ensure_array_like(field.options);
                                      for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
                                        let option = each_array_4[$$index_3];
                                        if (typeof option === "object" && option.value) {
                                          $$renderer4.push("<!--[-->");
                                          $$renderer4.option({ value: option.value }, ($$renderer5) => {
                                            $$renderer5.push(`${escape_html(option.label)}`);
                                          });
                                        } else {
                                          $$renderer4.push("<!--[!-->");
                                          $$renderer4.option({ value: option }, ($$renderer5) => {
                                            $$renderer5.push(`${escape_html(option)}`);
                                          });
                                        }
                                        $$renderer4.push(`<!--]-->`);
                                      }
                                      $$renderer4.push(`<!--]-->`);
                                    }
                                  );
                                } else {
                                  $$renderer3.push("<!--[!-->");
                                  if (field.type === "textarea") {
                                    $$renderer3.push("<!--[-->");
                                    $$renderer3.push(`<textarea${attr("id", field.name)}${attr("name", field.name)}${attr("placeholder", field.placeholder)}>`);
                                    push_element($$renderer3, "textarea", 928, 18);
                                    const $$body_6 = escape_html(formData[field.name]);
                                    if ($$body_6) {
                                      $$renderer3.push(`${$$body_6}`);
                                    }
                                    $$renderer3.push(`</textarea>`);
                                    pop_element();
                                  } else {
                                    $$renderer3.push("<!--[!-->");
                                  }
                                  $$renderer3.push(`<!--]-->`);
                                }
                                $$renderer3.push(`<!--]-->`);
                              }
                              $$renderer3.push(`<!--]-->`);
                            }
                            $$renderer3.push(`<!--]-->`);
                          }
                          $$renderer3.push(`<!--]--></div>`);
                          pop_element();
                        } else {
                          $$renderer3.push("<!--[!-->");
                        }
                        $$renderer3.push(`<!--]-->`);
                      }
                      $$renderer3.push(`<!--]-->`);
                    }
                    $$renderer3.push(`<!--]-->`);
                  } else {
                    $$renderer3.push("<!--[!-->");
                    $$renderer3.push(`<!--[-->`);
                    const each_array_5 = ensure_array_like(config.fields);
                    for (let $$index_6 = 0, $$length = each_array_5.length; $$index_6 < $$length; $$index_6++) {
                      let field = each_array_5[$$index_6];
                      $$renderer3.push(`<div class="form-group">`);
                      push_element($$renderer3, "div", 941, 12);
                      $$renderer3.push(`<label${attr("for", field.name)}>`);
                      push_element($$renderer3, "label", 942, 14);
                      $$renderer3.push(`${escape_html(field.label)}</label>`);
                      pop_element();
                      $$renderer3.push(` `);
                      if (field.type === "text") {
                        $$renderer3.push("<!--[-->");
                        $$renderer3.push(`<input type="text"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("placeholder", field.placeholder)}${attr("required", field.required, true)}${attr("readonly", field.readonly, true)}${attr_class(clsx(field.readonly ? "readonly" : ""))}/>`);
                        push_element($$renderer3, "input", 945, 16);
                        pop_element();
                      } else {
                        $$renderer3.push("<!--[!-->");
                        if (field.type === "date") {
                          $$renderer3.push("<!--[-->");
                          $$renderer3.push(`<input type="date"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("required", field.required, true)}/>`);
                          push_element($$renderer3, "input", 956, 16);
                          pop_element();
                        } else {
                          $$renderer3.push("<!--[!-->");
                          if (field.type === "time") {
                            $$renderer3.push("<!--[-->");
                            $$renderer3.push(`<input type="text"${attr("id", field.name)}${attr("name", field.name)}${attr("value", formData[field.name])}${attr("placeholder", field.placeholder)} maxlength="5"/>`);
                            push_element($$renderer3, "input", 964, 16);
                            pop_element();
                          } else {
                            $$renderer3.push("<!--[!-->");
                            if (field.type === "select") {
                              $$renderer3.push("<!--[-->");
                              $$renderer3.select(
                                {
                                  id: field.name,
                                  name: field.name,
                                  value: formData[field.name],
                                  required: field.required
                                },
                                ($$renderer4) => {
                                  $$renderer4.option({ value: "" }, ($$renderer5) => {
                                    $$renderer5.push(`Select ${escape_html(field.label)}`);
                                  });
                                  $$renderer4.push(`<!--[-->`);
                                  const each_array_6 = ensure_array_like(field.options);
                                  for (let $$index_5 = 0, $$length2 = each_array_6.length; $$index_5 < $$length2; $$index_5++) {
                                    let option = each_array_6[$$index_5];
                                    $$renderer4.option({ value: option }, ($$renderer5) => {
                                      $$renderer5.push(`${escape_html(option)}`);
                                    });
                                  }
                                  $$renderer4.push(`<!--]-->`);
                                }
                              );
                            } else {
                              $$renderer3.push("<!--[!-->");
                              if (field.type === "textarea") {
                                $$renderer3.push("<!--[-->");
                                $$renderer3.push(`<textarea${attr("id", field.name)}${attr("name", field.name)}${attr("placeholder", field.placeholder)}>`);
                                push_element($$renderer3, "textarea", 986, 16);
                                const $$body_7 = escape_html(formData[field.name]);
                                if ($$body_7) {
                                  $$renderer3.push(`${$$body_7}`);
                                }
                                $$renderer3.push(`</textarea>`);
                                pop_element();
                              } else {
                                $$renderer3.push("<!--[!-->");
                              }
                              $$renderer3.push(`<!--]-->`);
                            }
                            $$renderer3.push(`<!--]-->`);
                          }
                          $$renderer3.push(`<!--]-->`);
                        }
                        $$renderer3.push(`<!--]-->`);
                      }
                      $$renderer3.push(`<!--]--></div>`);
                      pop_element();
                    }
                    $$renderer3.push(`<!--]-->`);
                  }
                  $$renderer3.push(`<!--]-->`);
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
        pop_element();
        $$renderer3.push(` `);
        if (showTripSelector) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="form-group">`);
          push_element($$renderer3, "div", 1001, 6);
          ItemCompanionsForm($$renderer3, {
            companions: selectedCompanions,
            onCompanionsUpdate: (companions) => {
              selectedCompanions = companions;
              if (isEditing && data?.id && selectedTripId) {
                const companionIds = companions.map((c) => c.id);
                itemCompanionsApi.update(itemType, data.id, companionIds).catch((err) => {
                });
              } else if (isEditing && data?.id && !selectedTripId) {
                const companionIds = companions.map((c) => c.id);
                itemCompanionsApi.update(itemType, data.id, companionIds).catch((err) => {
                });
              }
            },
            onAddCompanion: null,
            onRemoveCompanion: null
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (itemType === "trip" && isEditing && data?.id) {
          $$renderer3.push("<!--[-->");
          TripCompanionsForm($$renderer3, {
            tripId: data.id,
            companions: data.tripCompanions || [],
            onCompanionsUpdate: async (companions) => {
              if (data) {
                data.tripCompanions = companions;
                try {
                  const updatedTrip = await tripsApi.getOne(data.id);
                  if (updatedTrip) {
                    Object.assign(data, updatedTrip);
                    data = data;
                    if (onSave) {
                      onSave(updatedTrip);
                    }
                  }
                } catch (err) {
                }
              }
            }
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> <div class="form-buttons">`);
        push_element($$renderer3, "div", 1060, 4);
        $$renderer3.push(`<button type="submit"${attr("disabled", loading, true)} class="submit-btn">`);
        push_element($$renderer3, "button", 1061, 6);
        $$renderer3.push(`${escape_html(isEditing ? "Update" : "Add")}</button>`);
        pop_element();
        $$renderer3.push(` <button type="button"${attr("disabled", loading, true)} class="cancel-btn">`);
        push_element($$renderer3, "button", 1064, 6);
        $$renderer3.push(`Cancel</button>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
        $$renderer3.push(` `);
        if (isEditing) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<button type="button"${attr("disabled", loading, true)} class="delete-btn">`);
          push_element($$renderer3, "button", 1070, 6);
          $$renderer3.push(`Delete</button>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></form>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
      }
      do {
        $$settled = true;
        $$inner_renderer = $$renderer2.copy();
        $$render_inner($$inner_renderer);
      } while (!$$settled);
      $$renderer2.subsume($$inner_renderer);
      bind_props($$props, { itemType, data, tripId, allTrips, onClose, onSave });
    },
    ItemEditForm
  );
}
ItemEditForm.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
DashboardCalendar[FILENAME] = "src/lib/components/DashboardCalendar.svelte";
function DashboardCalendar($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let trips = fallback($$props["trips"], () => [], true);
      let standaloneItems = fallback(
        $$props["standaloneItems"],
        () => ({
          flights: [],
          hotels: [],
          transportation: [],
          carRentals: [],
          events: []
        }),
        true
      );
      let onItemClick = fallback($$props["onItemClick"], () => {
      });
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const itemColors = {
        trip: "#28536b",
        flight: "#d4a823",
        hotel: "#9b6db3",
        event: "#d6389f",
        transportation: "#2b7ab6",
        carRental: "#d97a2f"
      };
      let months = [];
      let dateToItems = {};
      let globalItemRowAssignments = {};
      let today = /* @__PURE__ */ new Date();
      const specialDates = /* @__PURE__ */ new Set([
        "2026-01-01",
        // January 1
        "2026-01-19",
        // January 19
        "2026-05-25",
        // May 25
        "2026-06-19",
        // June 19
        "2026-07-03",
        // July 3
        "2026-09-07",
        // September 7
        "2026-11-26",
        // November 26
        "2026-11-27",
        // November 27
        "2026-12-24",
        // December 24
        "2026-12-25",
        // December 25
        "2026-12-28",
        // December 28
        "2026-12-29",
        // December 29
        "2026-12-30",
        // December 30
        "2026-12-31"
        // December 31
      ]);
      function isSpecialDate(dateKey) {
        if (!dateKey) return false;
        return specialDates.has(dateKey);
      }
      function getDateKey(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      function parseDateOnly(dateStr) {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      function normalizeDate(date) {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
      }
      function buildCalendarData() {
        today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        dateToItems = {};
        const startMonth = new Date(today);
        startMonth.setMonth(today.getMonth() - 3);
        startMonth.setDate(1);
        const endMonth = new Date(today);
        endMonth.setMonth(today.getMonth() + 15);
        endMonth.setDate(1);
        function addItemToDate(dateStr, item) {
          if (!dateToItems[dateStr]) dateToItems[dateStr] = [];
          if (!dateToItems[dateStr].some((i) => i.id === item.id)) {
            dateToItems[dateStr].push(item);
          }
        }
        function addItemAcrossMonths(item) {
          const startKey = getDateKey(item.startDate);
          addItemToDate(startKey, item);
          let currentMonthStart = new Date(item.startDate);
          currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
          currentMonthStart.setDate(1);
          while (currentMonthStart <= item.endDate) {
            const monthStartKey = getDateKey(currentMonthStart);
            addItemToDate(monthStartKey, item);
            currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
          }
        }
        trips.forEach((trip) => {
          if (!trip.departureDate || !trip.returnDate) return;
          const depDate = parseDateOnly(trip.departureDate);
          const retDate = parseDateOnly(trip.returnDate);
          const durationDays = Math.ceil((retDate.getTime() - depDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
          const tripItem = {
            id: trip.id,
            type: "trip",
            data: trip,
            startDate: depDate,
            endDate: retDate,
            durationDays
          };
          addItemAcrossMonths(tripItem);
          if (trip.flights) {
            trip.flights.forEach((flight) => {
              if (!flight.departureDateTime) return;
              let startDate = new Date(flight.departureDateTime);
              startDate.setHours(0, 0, 0, 0);
              let endDate = new Date(flight.arrivalDateTime || flight.departureDateTime);
              endDate.setHours(0, 0, 0, 0);
              const flightDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
              addItemAcrossMonths({
                id: flight.id,
                type: "flight",
                data: flight,
                startDate,
                endDate,
                durationDays: flightDurationDays
              });
            });
          }
          if (trip.hotels) {
            trip.hotels.forEach((hotel) => {
              if (!hotel.checkInDateTime) return;
              let startDate = new Date(hotel.checkInDateTime);
              startDate.setHours(0, 0, 0, 0);
              let endDate = new Date(hotel.checkOutDateTime || hotel.checkInDateTime);
              endDate.setHours(0, 0, 0, 0);
              const hotelDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
              addItemAcrossMonths({
                id: hotel.id,
                type: "hotel",
                data: hotel,
                startDate,
                endDate,
                durationDays: hotelDurationDays
              });
            });
          }
          if (trip.events) {
            trip.events.forEach((event) => {
              if (!event.startDateTime) return;
              let startDate = new Date(event.startDateTime);
              startDate.setHours(0, 0, 0, 0);
              let endDate = new Date(event.endDateTime || event.startDateTime);
              endDate.setHours(0, 0, 0, 0);
              const eventDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
              addItemAcrossMonths({
                id: event.id,
                type: "event",
                data: event,
                startDate,
                endDate,
                durationDays: eventDurationDays
              });
            });
          }
          if (trip.transportation) {
            trip.transportation.forEach((trans) => {
              if (!trans.departureDateTime) return;
              let startDate = new Date(trans.departureDateTime);
              startDate.setHours(0, 0, 0, 0);
              let endDate = new Date(trans.arrivalDateTime || trans.departureDateTime);
              endDate.setHours(0, 0, 0, 0);
              const transDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
              addItemAcrossMonths({
                id: trans.id,
                type: "transportation",
                data: trans,
                startDate,
                endDate,
                durationDays: transDurationDays
              });
            });
          }
          if (trip.carRentals) {
            trip.carRentals.forEach((carRental) => {
              if (!carRental.pickupDateTime) return;
              let startDate = new Date(carRental.pickupDateTime);
              startDate.setHours(0, 0, 0, 0);
              let endDate = new Date(carRental.dropoffDateTime || carRental.pickupDateTime);
              endDate.setHours(0, 0, 0, 0);
              const carDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
              addItemAcrossMonths({
                id: carRental.id,
                type: "carRental",
                data: carRental,
                startDate,
                endDate,
                durationDays: carDurationDays
              });
            });
          }
        });
        [
          "flights",
          "hotels",
          "transportation",
          "carRentals",
          "events"
        ].forEach((key) => {
          const typeMap = {
            flights: "flight",
            hotels: "hotel",
            transportation: "transportation",
            carRentals: "carRental",
            events: "event"
          };
          const itemType = typeMap[key];
          if (standaloneItems[key]) {
            standaloneItems[key].forEach((item) => {
              let startDate;
              let endDate;
              if (key === "flights") {
                startDate = new Date(item.departureDateTime);
                endDate = new Date(item.arrivalDateTime || item.departureDateTime);
              } else if (key === "hotels") {
                startDate = new Date(item.checkInDateTime);
                endDate = new Date(item.checkOutDateTime || item.checkInDateTime);
              } else if (key === "transportation") {
                startDate = new Date(item.departureDateTime);
                endDate = new Date(item.arrivalDateTime || item.departureDateTime);
              } else if (key === "carRentals") {
                startDate = new Date(item.pickupDateTime);
                endDate = new Date(item.dropoffDateTime || item.pickupDateTime);
              } else if (key === "events") {
                startDate = new Date(item.startDateTime);
                endDate = new Date(item.endDateTime || item.startDateTime);
              } else {
                return;
              }
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
              addItemAcrossMonths({
                id: item.id,
                type: itemType,
                data: item,
                startDate,
                endDate,
                durationDays
              });
            });
          }
        });
        assignItemRows();
        buildMonthData(startMonth, endMonth);
      }
      function assignItemRows() {
        globalItemRowAssignments = {};
        const globalRowOccupancy = [];
        const allItems = Object.values(dateToItems).flat();
        const uniqueItems = Array.from(new Map(allItems.map((item) => [item.id, item])).values());
        uniqueItems.forEach((item) => {
          const itemStart = normalizeDate(item.startDate).getTime();
          const itemEnd = normalizeDate(item.endDate).getTime();
          let assignedRow = -1;
          for (let rowIdx = 0; rowIdx < globalRowOccupancy.length; rowIdx++) {
            let canFitInRow = true;
            for (const otherItem of globalRowOccupancy[rowIdx]) {
              const otherStart = normalizeDate(otherItem.startDate).getTime();
              const otherEnd = normalizeDate(otherItem.endDate).getTime();
              const overlaps = !(itemEnd < otherStart || itemStart > otherEnd);
              if (overlaps) {
                canFitInRow = false;
                break;
              }
            }
            if (canFitInRow) {
              assignedRow = rowIdx;
              globalRowOccupancy[rowIdx].push(item);
              break;
            }
          }
          if (assignedRow === -1) {
            assignedRow = globalRowOccupancy.length;
            globalRowOccupancy.push([item]);
          }
          globalItemRowAssignments[item.id] = assignedRow;
        });
      }
      function buildMonthData(startMonth, endMonth) {
        months = [];
        let currentDate = new Date(startMonth);
        while (currentDate < endMonth) {
          const monthYear = {
            month: currentDate.getMonth(),
            year: currentDate.getFullYear()
          };
          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          const days = [];
          for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day, 0, 0, 0, 0));
            const key = getDateKey(dateObj);
            days.push({
              day,
              dateKey: key,
              items: dateToItems[key] || [],
              isToday: key === getDateKey(today),
              isBlank: false
            });
          }
          for (let i = daysInMonth; i < 31; i++) {
            days.push({
              day: null,
              dateKey: null,
              items: [],
              isToday: false,
              isBlank: true
            });
          }
          months.push({
            month: monthYear.month,
            year: monthYear.year,
            name: monthNames[monthYear.month],
            days
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
      function getItemColor(item) {
        return itemColors[item.type] || "#666666";
      }
      function getItemLabel(item) {
        const { type, data } = item;
        if (type === "trip") return data.name;
        if (type === "flight") return `${data.origin?.substring(0, 3) || "?"} → ${data.destination?.substring(0, 3) || "?"}`;
        if (type === "hotel") return data.hotelName || data.name || "Hotel";
        if (type === "event") return data.name || "Event";
        if (type === "transportation") return `${data.method || "Transit"}`;
        if (type === "carRental") return data.company || "Car Rental";
        return "Item";
      }
      function getItemIcon(item) {
        const iconMap = {
          trip: "luggage",
          flight: "flight",
          hotel: "hotel",
          event: "event",
          transportation: "train",
          carRental: "directions_car"
        };
        return iconMap[item.type] || "info";
      }
      {
        buildCalendarData();
      }
      $$renderer2.push(`<div class="calendar-container svelte-1qvkaye">`);
      push_element($$renderer2, "div", 441, 0);
      $$renderer2.push(`<div class="calendar-grid svelte-1qvkaye">`);
      push_element($$renderer2, "div", 442, 2);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(
        // Helper to get end of month date
        // Helper to add item to a specific date
        // Only add if not already present (avoid duplicates)
        // Helper to add item across all months it spans
        // For items spanning multiple months, add to first day of each subsequent month
        // Add trips
        // Add flights
        // Add hotels
        // Add events
        // Add transportation
        // Add car rentals
        // Add standalone items
        // Calculate global row assignments
        // Build month data
        // Pad to 31 days
        months
      );
      for (let $$index_3 = 0, $$length = each_array.length; $$index_3 < $$length; $$index_3++) {
        let monthData = each_array[$$index_3];
        const maxRowInMonth = monthData.days.flatMap((d) => d.items).reduce(
          (max, item) => {
            const row = globalItemRowAssignments[item.id] ?? 0;
            return Math.max(max, row);
          },
          -1
        );
        const monthHeight = Math.max(2, 1.2 + (maxRowInMonth + 1) * 1.75);
        $$renderer2.push(`<div class="month-row svelte-1qvkaye"${attr_style(`min-height: ${stringify(monthHeight)}rem;`)}>`);
        push_element($$renderer2, "div", 450, 6);
        $$renderer2.push(`<div class="month-label svelte-1qvkaye">`);
        push_element($$renderer2, "div", 452, 8);
        $$renderer2.push(`<div class="month-name svelte-1qvkaye">`);
        push_element($$renderer2, "div", 453, 10);
        $$renderer2.push(`${escape_html(monthData.name.substring(0, 3))}</div>`);
        pop_element();
        $$renderer2.push(` <div class="year svelte-1qvkaye">`);
        push_element($$renderer2, "div", 454, 10);
        $$renderer2.push(`${escape_html(monthData.year)}</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="days-grid svelte-1qvkaye">`);
        push_element($$renderer2, "div", 458, 8);
        $$renderer2.push(`<div class="items-layer svelte-1qvkaye">`);
        push_element($$renderer2, "div", 460, 10);
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(monthData.days);
        for (let dayIdx = 0, $$length2 = each_array_1.length; dayIdx < $$length2; dayIdx++) {
          let day = each_array_1[dayIdx];
          $$renderer2.push(`<!--[-->`);
          const each_array_2 = ensure_array_like(day.items);
          for (let $$index = 0, $$length3 = each_array_2.length; $$index < $$length3; $$index++) {
            let item = each_array_2[$$index];
            const rowInMonth = globalItemRowAssignments[item.id] ?? 0;
            const startDayIdx = monthData.days.findIndex((d) => d.dateKey === getDateKey(item.startDate));
            const endDayIdx = monthData.days.findIndex((d) => d.dateKey === getDateKey(item.endDate));
            const displayStartIdx = startDayIdx >= 0 ? startDayIdx : startDayIdx < 0 && endDayIdx >= 0 ? 0 : dayIdx;
            const daysSpanned = Math.max(1, (endDayIdx >= 0 ? endDayIdx : 30) - displayStartIdx + 1);
            if (startDayIdx === dayIdx || startDayIdx < 0 && dayIdx === 0 && endDayIdx >= 0) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div${attr_class("item-bar svelte-1qvkaye", void 0, { "flight-item": item.type === "flight" })}${attr_style(` --day-idx: ${stringify(displayStartIdx)}; --span: ${stringify(daysSpanned)}; --row-in-month: ${stringify(rowInMonth)}; background-color: ${stringify(getItemColor(item))}4d; color: ${stringify(item.type === "flight" ? "#5a4a0f" : getItemColor(item))}; `)} role="button" tabindex="0">`);
              push_element($$renderer2, "div", 470, 18);
              if (item.type !== "flight") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<span class="material-symbols-outlined">`);
                push_element($$renderer2, "span", 486, 22);
                $$renderer2.push(`${escape_html(getItemIcon(item))}</span>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> `);
              if (item.type === "flight") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="flight-info svelte-1qvkaye">`);
                push_element($$renderer2, "div", 489, 22);
                $$renderer2.push(`<div class="flight-line svelte-1qvkaye">`);
                push_element($$renderer2, "div", 490, 24);
                $$renderer2.push(`${escape_html(item.data.origin?.substring(0, 3) || "?")}</div>`);
                pop_element();
                $$renderer2.push(` <div class="flight-line svelte-1qvkaye">`);
                push_element($$renderer2, "div", 491, 24);
                $$renderer2.push(`${escape_html(item.data.destination?.substring(0, 3) || "?")}</div>`);
                pop_element();
                $$renderer2.push(`</div>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
                $$renderer2.push(`<span class="item-label svelte-1qvkaye">`);
                push_element($$renderer2, "span", 494, 22);
                $$renderer2.push(`${escape_html(getItemLabel(item))}</span>`);
                pop_element();
              }
              $$renderer2.push(`<!--]--></div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(` <!--[-->`);
        const each_array_3 = ensure_array_like(monthData.days);
        for (let dayIdx = 0, $$length2 = each_array_3.length; dayIdx < $$length2; dayIdx++) {
          let day = each_array_3[dayIdx];
          $$renderer2.push(`<div${attr_class("day-cell svelte-1qvkaye", void 0, {
            "today": day.isToday,
            "blank": day.isBlank,
            "weekend": !day.isBlank && day.dateKey && (new Date(day.dateKey).getUTCDay() === 0 || new Date(day.dateKey).getUTCDay() === 6),
            "special": day.dateKey && isSpecialDate(day.dateKey)
          })}>`);
          push_element($$renderer2, "div", 504, 12);
          if (!day.isBlank && day.day) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="day-number svelte-1qvkaye">`);
            push_element($$renderer2, "span", 512, 16);
            $$renderer2.push(`${escape_html(day.day)}</span>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      bind_props($$props, { trips, standaloneItems, onItemClick });
    },
    DashboardCalendar
  );
}
DashboardCalendar.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
SettingsProfile[FILENAME] = "src/lib/components/SettingsProfile.svelte";
function SettingsProfile($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let data = fallback(
        $$props["data"],
        null
        // User data passed from parent
      );
      let loading = false;
      let formData = {
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || ""
      };
      data?.email || "";
      $$renderer2.push(`<div class="edit-panel">`);
      push_element($$renderer2, "div", 91, 0);
      $$renderer2.push(`<form class="edit-content">`);
      push_element($$renderer2, "form", 92, 2);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="form-fields">`);
      push_element($$renderer2, "div", 97, 4);
      $$renderer2.push(`<div class="form-row cols-2">`);
      push_element($$renderer2, "div", 98, 6);
      $$renderer2.push(`<div class="form-group">`);
      push_element($$renderer2, "div", 99, 8);
      $$renderer2.push(`<label for="firstName">`);
      push_element($$renderer2, "label", 100, 10);
      $$renderer2.push(`First Name</label>`);
      pop_element();
      $$renderer2.push(` <input type="text" id="firstName"${attr("value", formData.firstName)} placeholder="John" required/>`);
      push_element($$renderer2, "input", 101, 10);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="form-group">`);
      push_element($$renderer2, "div", 110, 8);
      $$renderer2.push(`<label for="lastName">`);
      push_element($$renderer2, "label", 111, 10);
      $$renderer2.push(`Last Initial</label>`);
      pop_element();
      $$renderer2.push(` <input type="text" id="lastName"${attr("value", formData.lastName)} placeholder="D" maxlength="1" required/>`);
      push_element($$renderer2, "input", 112, 10);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="form-group">`);
      push_element($$renderer2, "div", 124, 6);
      $$renderer2.push(`<label for="email">`);
      push_element($$renderer2, "label", 125, 8);
      $$renderer2.push(`Email Address</label>`);
      pop_element();
      $$renderer2.push(` <input type="email" id="email"${attr("value", formData.email)} placeholder="john@example.com" autocomplete="new-email" required/>`);
      push_element($$renderer2, "input", 126, 8);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="form-buttons">`);
      push_element($$renderer2, "div", 137, 4);
      $$renderer2.push(`<button type="submit"${attr("disabled", loading, true)} class="submit-btn">`);
      push_element($$renderer2, "button", 138, 6);
      $$renderer2.push(`${escape_html("Update Profile")}</button>`);
      pop_element();
      $$renderer2.push(` <button type="button"${attr("disabled", loading, true)} class="cancel-btn">`);
      push_element($$renderer2, "button", 141, 6);
      $$renderer2.push(`Cancel</button>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</form>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      bind_props($$props, { data });
    },
    SettingsProfile
  );
}
SettingsProfile.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
SettingsSecurity[FILENAME] = "src/lib/components/SettingsSecurity.svelte";
function SettingsSecurity($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let loading = false;
      let formData = { currentPassword: "", newPassword: "", confirmPassword: "" };
      $$renderer2.push(`<div class="edit-panel">`);
      push_element($$renderer2, "div", 95, 0);
      $$renderer2.push(`<form class="edit-content">`);
      push_element($$renderer2, "form", 96, 2);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="form-fields">`);
      push_element($$renderer2, "div", 101, 4);
      $$renderer2.push(`<div class="form-group">`);
      push_element($$renderer2, "div", 102, 6);
      $$renderer2.push(`<label for="currentPassword">`);
      push_element($$renderer2, "label", 103, 8);
      $$renderer2.push(`Current Password</label>`);
      pop_element();
      $$renderer2.push(` <input type="password" id="currentPassword"${attr("value", formData.currentPassword)} placeholder="Enter your current password"${attr("disabled", loading, true)} required/>`);
      push_element($$renderer2, "input", 104, 8);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="password-info svelte-1w2c911">`);
      push_element($$renderer2, "div", 115, 6);
      $$renderer2.push(`<p class="info-text svelte-1w2c911">`);
      push_element($$renderer2, "p", 116, 8);
      $$renderer2.push(`<span class="material-symbols-outlined">`);
      push_element($$renderer2, "span", 117, 10);
      $$renderer2.push(`info</span>`);
      pop_element();
      $$renderer2.push(` Password must be at least 6 characters long</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="form-group">`);
      push_element($$renderer2, "div", 122, 6);
      $$renderer2.push(`<label for="newPassword">`);
      push_element($$renderer2, "label", 123, 8);
      $$renderer2.push(`New Password</label>`);
      pop_element();
      $$renderer2.push(` <input type="password" id="newPassword"${attr("value", formData.newPassword)} placeholder="Enter your new password"${attr("disabled", loading, true)} required/>`);
      push_element($$renderer2, "input", 124, 8);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="form-group">`);
      push_element($$renderer2, "div", 136, 6);
      $$renderer2.push(`<label for="confirmPassword">`);
      push_element($$renderer2, "label", 137, 8);
      $$renderer2.push(`Confirm New Password</label>`);
      pop_element();
      $$renderer2.push(` <input type="password" id="confirmPassword"${attr("value", formData.confirmPassword)} placeholder="Confirm your new password"${attr("disabled", loading, true)} required/>`);
      push_element($$renderer2, "input", 138, 8);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="form-buttons">`);
      push_element($$renderer2, "div", 154, 4);
      $$renderer2.push(`<button type="submit"${attr("disabled", false, true)} class="submit-btn">`);
      push_element($$renderer2, "button", 155, 6);
      $$renderer2.push(`${escape_html("Change Password")}</button>`);
      pop_element();
      $$renderer2.push(` <button type="button"${attr("disabled", loading, true)} class="cancel-btn">`);
      push_element($$renderer2, "button", 158, 6);
      $$renderer2.push(`Cancel</button>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</form>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    SettingsSecurity
  );
}
SettingsSecurity.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
SettingsVouchers[FILENAME] = "src/lib/components/SettingsVouchers.svelte";
function SettingsVouchers($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let onEditVoucher = fallback($$props["onEditVoucher"], null);
      $$renderer2.push(`<div class="settings-vouchers-container svelte-113vqn2">`);
      push_element($$renderer2, "div", 162, 0);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="vouchers-view svelte-113vqn2">`);
        push_element($$renderer2, "div", 172, 4);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="loading-state svelte-113vqn2">`);
          push_element($$renderer2, "div", 195, 8);
          $$renderer2.push(`<span class="material-symbols-outlined">`);
          push_element($$renderer2, "span", 196, 10);
          $$renderer2.push(`hourglass_empty</span>`);
          pop_element();
          $$renderer2.push(` <p>`);
          push_element($$renderer2, "p", 197, 10);
          $$renderer2.push(`Loading vouchers...</p>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { onEditVoucher });
    },
    SettingsVouchers
  );
}
SettingsVouchers.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
SettingsCompanions[FILENAME] = "src/lib/components/SettingsCompanions.svelte";
function SettingsCompanions($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      $$renderer2.push(`<div class="settings-companions-container svelte-1srup7e">`);
      push_element($$renderer2, "div", 101, 0);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="loading-state svelte-1srup7e">`);
        push_element($$renderer2, "div", 111, 4);
        $$renderer2.push(`<span class="material-symbols-outlined">`);
        push_element($$renderer2, "span", 112, 6);
        $$renderer2.push(`hourglass_empty</span>`);
        pop_element();
        $$renderer2.push(` <p>`);
        push_element($$renderer2, "p", 113, 6);
        $$renderer2.push(`Loading companions...</p>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    SettingsCompanions
  );
}
SettingsCompanions.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
SettingsBackup[FILENAME] = "src/lib/components/SettingsBackup.svelte";
function SettingsBackup($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let loading = false;
      let importLoading = false;
      $$renderer2.push(`<div class="settings-backup-container svelte-xh59jx">`);
      push_element($$renderer2, "div", 282, 0);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="export-section svelte-xh59jx">`);
      push_element($$renderer2, "div", 292, 2);
      $$renderer2.push(`<div class="section-header svelte-xh59jx">`);
      push_element($$renderer2, "div", 293, 4);
      $$renderer2.push(`<div class="icon-box export svelte-xh59jx">`);
      push_element($$renderer2, "div", 294, 6);
      $$renderer2.push(`<span class="material-symbols-outlined">`);
      push_element($$renderer2, "span", 295, 8);
      $$renderer2.push(`download</span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <h3 class="svelte-xh59jx">`);
      push_element($$renderer2, "h3", 297, 6);
      $$renderer2.push(`Export Data</h3>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      Button($$renderer2, {
        variant: "primary",
        disabled: loading,
        loading,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<span class="material-symbols-outlined">`);
          push_element($$renderer3, "span", 306, 6);
          $$renderer3.push(`download</span>`);
          pop_element();
          $$renderer3.push(` Download Backup`);
        }),
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` <div class="import-section svelte-xh59jx">`);
      push_element($$renderer2, "div", 312, 2);
      $$renderer2.push(`<div class="section-header svelte-xh59jx">`);
      push_element($$renderer2, "div", 313, 4);
      $$renderer2.push(`<div class="icon-box import svelte-xh59jx">`);
      push_element($$renderer2, "div", 314, 6);
      $$renderer2.push(`<span class="material-symbols-outlined">`);
      push_element($$renderer2, "span", 315, 8);
      $$renderer2.push(`upload</span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <h3 class="svelte-xh59jx">`);
      push_element($$renderer2, "h3", 317, 6);
      $$renderer2.push(`Import Data</h3>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="file-input-wrapper svelte-xh59jx">`);
      push_element($$renderer2, "div", 320, 4);
      $$renderer2.push(`<input type="file" accept=".json" id="file-input"${attr("disabled", importLoading, true)} class="svelte-xh59jx"/>`);
      push_element($$renderer2, "input", 321, 6);
      pop_element();
      $$renderer2.push(` <label for="file-input" class="file-label svelte-xh59jx">`);
      push_element($$renderer2, "label", 328, 6);
      $$renderer2.push(`<span class="material-symbols-outlined">`);
      push_element($$renderer2, "span", 329, 8);
      $$renderer2.push(`description</span>`);
      pop_element();
      $$renderer2.push(` <span>`);
      push_element($$renderer2, "span", 330, 8);
      $$renderer2.push(`Choose JSON File</span>`);
      pop_element();
      $$renderer2.push(`</label>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    SettingsBackup
  );
}
SettingsBackup.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
function parseLocalDate(dateString) {
  if (!dateString) return /* @__PURE__ */ new Date(0);
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}
function getDateKeyForItem(item) {
  let date;
  let timezone = null;
  if (item.type === "trip") {
    date = parseLocalDate(item.data.departureDate);
  } else {
    date = item.sortDate;
    if (item.itemType === "flight") {
      timezone = item.data.originTimezone;
    } else if (item.itemType === "hotel") {
      timezone = item.data.timezone;
    } else if (item.itemType === "transportation") {
      timezone = item.data.originTimezone;
    } else if (item.itemType === "carRental") {
      timezone = item.data.pickupTimezone;
    } else if (item.itemType === "event") {
      timezone = item.data.timezone;
    }
  }
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        timeZone: timezone
      });
      const parts = formatter.formatToParts(date);
      const values = {};
      parts.forEach((part) => {
        if (part.type !== "literal") {
          values[part.type] = part.value;
        }
      });
      return `${values.year}-${values.month}`;
    } catch {
    }
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
DashboardItemEditor[FILENAME] = "src/routes/dashboard/components/DashboardItemEditor.svelte";
function DashboardItemEditor($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let secondarySidebarContent = fallback($$props["secondarySidebarContent"], null);
      let trips = fallback($$props["trips"], () => [], true);
      let standaloneItems = fallback($$props["standaloneItems"], () => ({}), true);
      const closeSecondarySidebar = () => {
        dashboardStoreActions.closeSecondarySidebar();
      };
      const handleItemSave = async (item) => {
      };
      const handleTertiarySidebarAction = (action, detail) => {
        {
          dashboardStoreActions.openTertiarySidebar({ type: "edit-voucher", data: { voucher: detail.voucher } });
        }
      };
      function shouldBeFullWidth() {
        if (!secondarySidebarContent) return false;
        const type = secondarySidebarContent.type;
        return type === "calendar" || type === "settings-vouchers" || type === "settings-companions" || type === "settings-backup";
      }
      $$renderer2.push(`<div${attr_class("secondary-content svelte-6bvbym", void 0, { "full-width": shouldBeFullWidth() })}>`);
      push_element($$renderer2, "div", 55, 0);
      if (secondarySidebarContent?.type === "calendar") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="calendar-sidebar-container svelte-6bvbym">`);
        push_element($$renderer2, "div", 58, 4);
        $$renderer2.push(`<div class="calendar-sidebar-header svelte-6bvbym">`);
        push_element($$renderer2, "div", 59, 6);
        $$renderer2.push(`<h2 class="svelte-6bvbym">`);
        push_element($$renderer2, "h2", 60, 8);
        $$renderer2.push(`Calendar</h2>`);
        pop_element();
        $$renderer2.push(` <button class="close-btn svelte-6bvbym" title="Close">`);
        push_element($$renderer2, "button", 61, 8);
        $$renderer2.push(`<span class="material-symbols-outlined">`);
        push_element($$renderer2, "span", 62, 10);
        $$renderer2.push(`close</span>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` `);
        DashboardCalendar($$renderer2, {
          trips,
          standaloneItems,
          onItemClick: (e) => dispatch("itemClick", e)
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        if (secondarySidebarContent?.type === "settings-profile") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="settings-panel svelte-6bvbym">`);
          push_element($$renderer2, "div", 68, 4);
          $$renderer2.push(`<div class="settings-panel-header svelte-6bvbym">`);
          push_element($$renderer2, "div", 69, 6);
          $$renderer2.push(`<h2 class="svelte-6bvbym">`);
          push_element($$renderer2, "h2", 70, 8);
          $$renderer2.push(`Profile</h2>`);
          pop_element();
          $$renderer2.push(` <button class="close-btn svelte-6bvbym" title="Close">`);
          push_element($$renderer2, "button", 71, 8);
          $$renderer2.push(`<span class="material-symbols-outlined">`);
          push_element($$renderer2, "span", 72, 10);
          $$renderer2.push(`close</span>`);
          pop_element();
          $$renderer2.push(`</button>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(` <div class="settings-panel-content svelte-6bvbym">`);
          push_element($$renderer2, "div", 75, 6);
          SettingsProfile($$renderer2, { data: secondarySidebarContent?.data });
          $$renderer2.push(`<!----></div>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
          if (secondarySidebarContent?.type === "settings-security") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="settings-panel svelte-6bvbym">`);
            push_element($$renderer2, "div", 80, 4);
            $$renderer2.push(`<div class="settings-panel-header svelte-6bvbym">`);
            push_element($$renderer2, "div", 81, 6);
            $$renderer2.push(`<h2 class="svelte-6bvbym">`);
            push_element($$renderer2, "h2", 82, 8);
            $$renderer2.push(`Security</h2>`);
            pop_element();
            $$renderer2.push(` <button class="close-btn svelte-6bvbym" title="Close">`);
            push_element($$renderer2, "button", 83, 8);
            $$renderer2.push(`<span class="material-symbols-outlined">`);
            push_element($$renderer2, "span", 84, 10);
            $$renderer2.push(`close</span>`);
            pop_element();
            $$renderer2.push(`</button>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
            $$renderer2.push(` <div class="settings-panel-content svelte-6bvbym">`);
            push_element($$renderer2, "div", 87, 6);
            SettingsSecurity($$renderer2);
            $$renderer2.push(`<!----></div>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
            if (secondarySidebarContent?.type === "settings-vouchers") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="calendar-sidebar-container svelte-6bvbym">`);
              push_element($$renderer2, "div", 92, 4);
              $$renderer2.push(`<div class="calendar-sidebar-header svelte-6bvbym">`);
              push_element($$renderer2, "div", 93, 6);
              $$renderer2.push(`<h2 class="svelte-6bvbym">`);
              push_element($$renderer2, "h2", 94, 8);
              $$renderer2.push(`Vouchers &amp; Credits</h2>`);
              pop_element();
              $$renderer2.push(` <div class="header-actions svelte-6bvbym">`);
              push_element($$renderer2, "div", 95, 8);
              $$renderer2.push(`<button class="icon-btn svelte-6bvbym" title="Add Voucher">`);
              push_element($$renderer2, "button", 96, 10);
              $$renderer2.push(`<span class="material-symbols-outlined">`);
              push_element($$renderer2, "span", 101, 12);
              $$renderer2.push(`qr_code_2_add</span>`);
              pop_element();
              $$renderer2.push(`</button>`);
              pop_element();
              $$renderer2.push(` <button class="close-btn svelte-6bvbym" title="Close">`);
              push_element($$renderer2, "button", 103, 10);
              $$renderer2.push(`<span class="material-symbols-outlined">`);
              push_element($$renderer2, "span", 104, 12);
              $$renderer2.push(`close</span>`);
              pop_element();
              $$renderer2.push(`</button>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
              $$renderer2.push(` `);
              SettingsVouchers($$renderer2, {
                onEditVoucher: (voucher) => handleTertiarySidebarAction("edit-voucher", { voucher })
              });
              $$renderer2.push(`<!----></div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
              if (secondarySidebarContent?.type === "settings-companions") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="calendar-sidebar-container svelte-6bvbym">`);
                push_element($$renderer2, "div", 113, 4);
                $$renderer2.push(`<div class="calendar-sidebar-header svelte-6bvbym">`);
                push_element($$renderer2, "div", 114, 6);
                $$renderer2.push(`<h2 class="svelte-6bvbym">`);
                push_element($$renderer2, "h2", 115, 8);
                $$renderer2.push(`Travel Companions</h2>`);
                pop_element();
                $$renderer2.push(` <div class="header-actions svelte-6bvbym">`);
                push_element($$renderer2, "div", 116, 8);
                $$renderer2.push(`<button class="icon-btn svelte-6bvbym" title="Add Companion">`);
                push_element($$renderer2, "button", 117, 10);
                $$renderer2.push(`<span class="material-symbols-outlined">`);
                push_element($$renderer2, "span", 122, 12);
                $$renderer2.push(`group_add</span>`);
                pop_element();
                $$renderer2.push(`</button>`);
                pop_element();
                $$renderer2.push(` <button class="close-btn svelte-6bvbym" title="Close">`);
                push_element($$renderer2, "button", 124, 10);
                $$renderer2.push(`<span class="material-symbols-outlined">`);
                push_element($$renderer2, "span", 125, 12);
                $$renderer2.push(`close</span>`);
                pop_element();
                $$renderer2.push(`</button>`);
                pop_element();
                $$renderer2.push(`</div>`);
                pop_element();
                $$renderer2.push(`</div>`);
                pop_element();
                $$renderer2.push(` `);
                SettingsCompanions($$renderer2);
                $$renderer2.push(`<!----></div>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
                if (secondarySidebarContent?.type === "settings-backup") {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<div class="calendar-sidebar-container svelte-6bvbym">`);
                  push_element($$renderer2, "div", 132, 4);
                  $$renderer2.push(`<div class="calendar-sidebar-header svelte-6bvbym">`);
                  push_element($$renderer2, "div", 133, 6);
                  $$renderer2.push(`<h2 class="svelte-6bvbym">`);
                  push_element($$renderer2, "h2", 134, 8);
                  $$renderer2.push(`Backup &amp; Export</h2>`);
                  pop_element();
                  $$renderer2.push(` <button class="close-btn svelte-6bvbym" title="Close">`);
                  push_element($$renderer2, "button", 135, 8);
                  $$renderer2.push(`<span class="material-symbols-outlined">`);
                  push_element($$renderer2, "span", 136, 10);
                  $$renderer2.push(`close</span>`);
                  pop_element();
                  $$renderer2.push(`</button>`);
                  pop_element();
                  $$renderer2.push(`</div>`);
                  pop_element();
                  $$renderer2.push(` `);
                  SettingsBackup($$renderer2);
                  $$renderer2.push(`<!----></div>`);
                  pop_element();
                } else {
                  $$renderer2.push("<!--[!-->");
                  if (secondarySidebarContent?.type === "newItemMenu") {
                    $$renderer2.push("<!--[-->");
                    $$renderer2.push(`<div class="new-item-menu svelte-6bvbym">`);
                    push_element($$renderer2, "div", 143, 4);
                    $$renderer2.push(`<div class="menu-header svelte-6bvbym">`);
                    push_element($$renderer2, "div", 144, 6);
                    $$renderer2.push(`<h2 class="menu-title svelte-6bvbym">`);
                    push_element($$renderer2, "h2", 145, 8);
                    $$renderer2.push(`Add New Item</h2>`);
                    pop_element();
                    $$renderer2.push(` <button class="close-menu-btn svelte-6bvbym" title="Close">`);
                    push_element($$renderer2, "button", 146, 8);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 147, 10);
                    $$renderer2.push(`close</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-items svelte-6bvbym">`);
                    push_element($$renderer2, "div", 151, 6);
                    $$renderer2.push(`<button class="menu-item svelte-6bvbym">`);
                    push_element($$renderer2, "button", 153, 8);
                    $$renderer2.push(`<div class="menu-item-icon amber svelte-6bvbym">`);
                    push_element($$renderer2, "div", 154, 10);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 155, 12);
                    $$renderer2.push(`flight</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-item-content svelte-6bvbym">`);
                    push_element($$renderer2, "div", 157, 10);
                    $$renderer2.push(`<h3 class="svelte-6bvbym">`);
                    push_element($$renderer2, "h3", 158, 12);
                    $$renderer2.push(`Trip</h3>`);
                    pop_element();
                    $$renderer2.push(` <p class="svelte-6bvbym">`);
                    push_element($$renderer2, "p", 159, 12);
                    $$renderer2.push(`Plan a complete trip with dates</p>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <span class="material-symbols-outlined menu-arrow svelte-6bvbym">`);
                    push_element($$renderer2, "span", 161, 10);
                    $$renderer2.push(`chevron_right</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-divider svelte-6bvbym">`);
                    push_element($$renderer2, "div", 165, 8);
                    $$renderer2.push(`<span>`);
                    push_element($$renderer2, "span", 166, 10);
                    $$renderer2.push(`or add a single item</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <button class="menu-item svelte-6bvbym">`);
                    push_element($$renderer2, "button", 170, 8);
                    $$renderer2.push(`<div class="menu-item-icon blue svelte-6bvbym">`);
                    push_element($$renderer2, "div", 171, 10);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 172, 12);
                    $$renderer2.push(`flight</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-item-content svelte-6bvbym">`);
                    push_element($$renderer2, "div", 174, 10);
                    $$renderer2.push(`<h3 class="svelte-6bvbym">`);
                    push_element($$renderer2, "h3", 175, 12);
                    $$renderer2.push(`Flight</h3>`);
                    pop_element();
                    $$renderer2.push(` <p class="svelte-6bvbym">`);
                    push_element($$renderer2, "p", 176, 12);
                    $$renderer2.push(`Add a flight booking</p>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <span class="material-symbols-outlined menu-arrow svelte-6bvbym">`);
                    push_element($$renderer2, "span", 178, 10);
                    $$renderer2.push(`chevron_right</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(` <button class="menu-item svelte-6bvbym">`);
                    push_element($$renderer2, "button", 182, 8);
                    $$renderer2.push(`<div class="menu-item-icon green svelte-6bvbym">`);
                    push_element($$renderer2, "div", 183, 10);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 184, 12);
                    $$renderer2.push(`hotel</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-item-content svelte-6bvbym">`);
                    push_element($$renderer2, "div", 186, 10);
                    $$renderer2.push(`<h3 class="svelte-6bvbym">`);
                    push_element($$renderer2, "h3", 187, 12);
                    $$renderer2.push(`Hotel</h3>`);
                    pop_element();
                    $$renderer2.push(` <p class="svelte-6bvbym">`);
                    push_element($$renderer2, "p", 188, 12);
                    $$renderer2.push(`Add a hotel or accommodation</p>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <span class="material-symbols-outlined menu-arrow svelte-6bvbym">`);
                    push_element($$renderer2, "span", 190, 10);
                    $$renderer2.push(`chevron_right</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(` <button class="menu-item svelte-6bvbym">`);
                    push_element($$renderer2, "button", 194, 8);
                    $$renderer2.push(`<div class="menu-item-icon red svelte-6bvbym">`);
                    push_element($$renderer2, "div", 195, 10);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 196, 12);
                    $$renderer2.push(`train</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-item-content svelte-6bvbym">`);
                    push_element($$renderer2, "div", 198, 10);
                    $$renderer2.push(`<h3 class="svelte-6bvbym">`);
                    push_element($$renderer2, "h3", 199, 12);
                    $$renderer2.push(`Transportation</h3>`);
                    pop_element();
                    $$renderer2.push(` <p class="svelte-6bvbym">`);
                    push_element($$renderer2, "p", 200, 12);
                    $$renderer2.push(`Train, bus, taxi, or other transit</p>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <span class="material-symbols-outlined menu-arrow svelte-6bvbym">`);
                    push_element($$renderer2, "span", 202, 10);
                    $$renderer2.push(`chevron_right</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(` <button class="menu-item svelte-6bvbym">`);
                    push_element($$renderer2, "button", 206, 8);
                    $$renderer2.push(`<div class="menu-item-icon gray svelte-6bvbym">`);
                    push_element($$renderer2, "div", 207, 10);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 208, 12);
                    $$renderer2.push(`directions_car</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-item-content svelte-6bvbym">`);
                    push_element($$renderer2, "div", 210, 10);
                    $$renderer2.push(`<h3 class="svelte-6bvbym">`);
                    push_element($$renderer2, "h3", 211, 12);
                    $$renderer2.push(`Car Rental</h3>`);
                    pop_element();
                    $$renderer2.push(` <p class="svelte-6bvbym">`);
                    push_element($$renderer2, "p", 212, 12);
                    $$renderer2.push(`Add a car rental booking</p>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <span class="material-symbols-outlined menu-arrow svelte-6bvbym">`);
                    push_element($$renderer2, "span", 214, 10);
                    $$renderer2.push(`chevron_right</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(` <button class="menu-item svelte-6bvbym">`);
                    push_element($$renderer2, "button", 218, 8);
                    $$renderer2.push(`<div class="menu-item-icon purple svelte-6bvbym">`);
                    push_element($$renderer2, "div", 219, 10);
                    $$renderer2.push(`<span class="material-symbols-outlined">`);
                    push_element($$renderer2, "span", 220, 12);
                    $$renderer2.push(`event</span>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <div class="menu-item-content svelte-6bvbym">`);
                    push_element($$renderer2, "div", 222, 10);
                    $$renderer2.push(`<h3 class="svelte-6bvbym">`);
                    push_element($$renderer2, "h3", 223, 12);
                    $$renderer2.push(`Event</h3>`);
                    pop_element();
                    $$renderer2.push(` <p class="svelte-6bvbym">`);
                    push_element($$renderer2, "p", 224, 12);
                    $$renderer2.push(`Concert, conference, or activity</p>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(` <span class="material-symbols-outlined menu-arrow svelte-6bvbym">`);
                    push_element($$renderer2, "span", 226, 10);
                    $$renderer2.push(`chevron_right</span>`);
                    pop_element();
                    $$renderer2.push(`</button>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                    $$renderer2.push(`</div>`);
                    pop_element();
                  } else {
                    $$renderer2.push("<!--[!-->");
                    if (secondarySidebarContent) {
                      $$renderer2.push("<!--[-->");
                      ItemEditForm($$renderer2, {
                        itemType: secondarySidebarContent.itemType || secondarySidebarContent.type,
                        data: secondarySidebarContent.data,
                        tripId: secondarySidebarContent.data?.tripId || "",
                        allTrips: trips,
                        onClose: closeSecondarySidebar,
                        onSave: handleItemSave
                      });
                    } else {
                      $$renderer2.push("<!--[!-->");
                    }
                    $$renderer2.push(`<!--]-->`);
                  }
                  $$renderer2.push(`<!--]-->`);
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { secondarySidebarContent, trips, standaloneItems });
    },
    DashboardItemEditor
  );
}
DashboardItemEditor.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_page[FILENAME] = "src/routes/dashboard/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let trips = [];
      let standaloneItems = {
        flights: [],
        hotels: [],
        transportation: [],
        carRentals: [],
        events: []
      };
      let filteredItems = [];
      let activeTab = "upcoming";
      let activeView = "trips";
      let mapData = {
        flights: [],
        hotels: [],
        events: [],
        transportation: [],
        carRentals: []
      };
      let highlightedTripId = null;
      let highlightedItemId = null;
      let highlightedItemType = null;
      let secondarySidebarContent = null;
      let groupedItems = {};
      let dateKeysInOrder = [];
      if (filteredItems.length > 0) {
        groupedItems = {};
        dateKeysInOrder = [];
        filteredItems.forEach((item) => {
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
      head("x1i5gj", $$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Dashboard - Bluebonnet</title>`);
        });
      });
      MapLayout($$renderer2, {
        tripData: mapData,
        isPast: activeTab === "past",
        highlightedTripId,
        highlightedItemType,
        highlightedItemId,
        $$slots: {
          primary: ($$renderer3) => {
            $$renderer3.push(`<div slot="primary" class="primary-content svelte-x1i5gj">`);
            push_element($$renderer3, "div", 394, 2);
            $$renderer3.push(`<div class="header-section svelte-x1i5gj">`);
            push_element($$renderer3, "div", 395, 4);
            $$renderer3.push(`<div class="header-top svelte-x1i5gj">`);
            push_element($$renderer3, "div", 396, 6);
            $$renderer3.push(`<h1 class="svelte-x1i5gj">`);
            push_element($$renderer3, "h1", 397, 8);
            $$renderer3.push(`My Trips</h1>`);
            pop_element();
            $$renderer3.push(` <div class="header-buttons svelte-x1i5gj">`);
            push_element($$renderer3, "div", 398, 8);
            $$renderer3.push(`<button class="icon-btn svelte-x1i5gj" title="View calendar">`);
            push_element($$renderer3, "button", 399, 10);
            $$renderer3.push(`<span class="material-symbols-outlined">`);
            push_element($$renderer3, "span", 400, 12);
            $$renderer3.push(`calendar_month</span>`);
            pop_element();
            $$renderer3.push(`</button>`);
            pop_element();
            $$renderer3.push(` <button class="add-btn svelte-x1i5gj" title="Add new trip">`);
            push_element($$renderer3, "button", 402, 10);
            $$renderer3.push(`<span class="material-symbols-outlined">`);
            push_element($$renderer3, "span", 403, 12);
            $$renderer3.push(`add</span>`);
            pop_element();
            $$renderer3.push(`</button>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` `);
            {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> <nav class="tabs svelte-x1i5gj">`);
            push_element($$renderer3, "nav", 412, 6);
            $$renderer3.push(`<div class="tabs-left svelte-x1i5gj">`);
            push_element($$renderer3, "div", 413, 8);
            $$renderer3.push(`<button${attr_class("tab-btn svelte-x1i5gj", void 0, { "active": activeTab === "upcoming" })}>`);
            push_element($$renderer3, "button", 414, 10);
            $$renderer3.push(`Upcoming</button>`);
            pop_element();
            $$renderer3.push(` <button${attr_class("tab-btn svelte-x1i5gj", void 0, { "active": activeTab === "past" })}>`);
            push_element($$renderer3, "button", 424, 10);
            $$renderer3.push(`Past</button>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <button${attr_class("tab-btn settings-btn svelte-x1i5gj", void 0, { "active": activeView === "settings" })} title="Settings">`);
            push_element($$renderer3, "button", 435, 8);
            $$renderer3.push(`<span class="material-symbols-outlined" style="font-size: 1.1rem;">`);
            push_element($$renderer3, "span", 441, 10);
            $$renderer3.push(`settings</span>`);
            pop_element();
            $$renderer3.push(`</button>`);
            pop_element();
            $$renderer3.push(`</nav>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <div class="trips-content svelte-x1i5gj">`);
            push_element($$renderer3, "div", 446, 4);
            {
              $$renderer3.push("<!--[!-->");
              {
                $$renderer3.push("<!--[-->");
                Loading($$renderer3, { message: "Loading trips..." });
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]--></div>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
          },
          secondary: ($$renderer3) => {
            $$renderer3.push(`<div slot="secondary"${attr_class("secondary-content svelte-x1i5gj", void 0, {
              "full-width": secondarySidebarContent?.type === "settings-backup"
            })}>`);
            push_element($$renderer3, "div", 801, 4);
            DashboardItemEditor($$renderer3, { secondarySidebarContent, trips, standaloneItems });
            $$renderer3.push(`<!----></div>`);
            pop_element();
          },
          tertiary: ($$renderer3) => {
            $$renderer3.push(`<div slot="tertiary" class="tertiary-content svelte-x1i5gj">`);
            push_element($$renderer3, "div", 925, 2);
            {
              $$renderer3.push("<!--[!-->");
              {
                $$renderer3.push("<!--[!-->");
                {
                  $$renderer3.push("<!--[!-->");
                  {
                    $$renderer3.push("<!--[!-->");
                  }
                  $$renderer3.push(`<!--]-->`);
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]--></div>`);
            pop_element();
          }
        }
      });
    },
    _page
  );
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
