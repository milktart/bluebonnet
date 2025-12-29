import { a1 as fallback, a5 as bind_props, $ as slot, a3 as attr_class, a4 as stringify, a7 as escape_html, _ as head } from "../../../chunks/index.js";
import "clsx";
/* empty css                                                      */
/* empty css                                                   */
function MapVisualization($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tripData = fallback($$props["tripData"], () => ({}), true);
    let fullTripData = fallback($$props["fullTripData"], null);
    let isPast = fallback($$props["isPast"], false);
    let highlightedTripId = fallback($$props["highlightedTripId"], null);
    let highlightedItemType = fallback($$props["highlightedItemType"], null);
    let highlightedItemId = fallback($$props["highlightedItemId"], null);
    let mapInstance;
    let activeAnimations = {};
    function highlightMapMarker(itemType, itemId) {
      return new Promise((resolve) => {
        highlightMapMarkerInternal();
      });
    }
    async function highlightMapMarkerInternal(itemType, itemId, onComplete) {
      return;
    }
    async function unhighlightMapMarker(markerId) {
      return;
    }
    function clearAllAnimations() {
      Object.keys(activeAnimations).forEach((markerId) => {
        unhighlightMapMarker();
      });
    }
    function getMapInstance() {
      return mapInstance;
    }
    $$renderer2.push(`<div style="width: 100%; height: 100%; position: absolute;"></div>`);
    bind_props($$props, {
      tripData,
      fullTripData,
      isPast,
      highlightedTripId,
      highlightedItemType,
      highlightedItemId,
      highlightMapMarker,
      unhighlightMapMarker,
      clearAllAnimations,
      getMapInstance
    });
  });
}
function MapLayout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tripData = fallback($$props["tripData"], null);
    let isPast = fallback($$props["isPast"], false);
    let highlightedTripId = fallback($$props["highlightedTripId"], null);
    let highlightedItemType = fallback($$props["highlightedItemType"], null);
    let highlightedItemId = fallback($$props["highlightedItemId"], null);
    let mapComponent;
    function getMapComponent() {
      return mapComponent;
    }
    $$renderer2.push(`<div class="map-layout svelte-4r5mac"><div id="tripMap" class="map-container svelte-4r5mac"><!---->`);
    {
      MapVisualization($$renderer2, {
        tripData,
        isPast,
        highlightedTripId,
        highlightedItemType,
        highlightedItemId
      });
    }
    $$renderer2.push(`<!----></div> <aside class="primary-sidebar sidebar svelte-4r5mac"><!--[-->`);
    slot($$renderer2, $$props, "primary", {});
    $$renderer2.push(`<!--]--></aside> <aside id="secondary-sidebar" class="secondary-sidebar sidebar svelte-4r5mac"><!--[-->`);
    slot($$renderer2, $$props, "secondary", {});
    $$renderer2.push(`<!--]--></aside> <aside id="tertiary-sidebar" class="tertiary-sidebar sidebar svelte-4r5mac"><!--[-->`);
    slot($$renderer2, $$props, "tertiary", {});
    $$renderer2.push(`<!--]--></aside></div>`);
    bind_props($$props, {
      tripData,
      isPast,
      highlightedTripId,
      highlightedItemType,
      highlightedItemId,
      getMapComponent
    });
  });
}
function Loading($$renderer, $$props) {
  let size = fallback($$props["size"], "medium");
  let message = fallback($$props["message"], "Loading...");
  $$renderer.push(`<div${attr_class(`loading-container loading-${stringify(size)}`, "svelte-1a5pdw0")}><div class="spinner svelte-1a5pdw0"></div> `);
  if (message) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<p class="loading-message svelte-1a5pdw0">${escape_html(message)}</p>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div>`);
  bind_props($$props, { size, message });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
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
          const formatter = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: timezone });
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
    function parseLocalDate(dateString) {
      if (!dateString) return /* @__PURE__ */ new Date(0);
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
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
          $$renderer3.push(`<div slot="primary" class="primary-content svelte-x1i5gj"><div class="header-section svelte-x1i5gj"><div class="header-top svelte-x1i5gj"><h1 class="svelte-x1i5gj">My Trips</h1> <div class="header-buttons svelte-x1i5gj"><button class="icon-btn svelte-x1i5gj" title="View calendar"><span class="material-symbols-outlined">calendar_month</span></button> <button class="add-btn svelte-x1i5gj" title="Add new trip"><span class="material-symbols-outlined">add</span></button></div></div> `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> <nav class="tabs svelte-x1i5gj"><div class="tabs-left svelte-x1i5gj"><button${attr_class("tab-btn svelte-x1i5gj", void 0, { "active": activeTab === "upcoming" })}>Upcoming</button> <button${attr_class("tab-btn svelte-x1i5gj", void 0, { "active": activeTab === "past" })}>Past</button></div> <button${attr_class("tab-btn settings-btn svelte-x1i5gj", void 0, { "active": activeView === "settings" })} title="Settings"><span class="material-symbols-outlined" style="font-size: 1.1rem;">settings</span></button></nav></div> <div class="trips-content svelte-x1i5gj">`);
          {
            $$renderer3.push("<!--[!-->");
            {
              $$renderer3.push("<!--[-->");
              Loading($$renderer3, { message: "Loading trips..." });
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]--></div></div>`);
        },
        secondary: ($$renderer3) => {
          $$renderer3.push(`<div slot="secondary"${attr_class("secondary-content svelte-x1i5gj", void 0, {
            "full-width": secondarySidebarContent?.type === "settings-backup"
          })}>`);
          {
            $$renderer3.push("<!--[!-->");
            {
              $$renderer3.push("<!--[!-->");
              {
                $$renderer3.push("<!--[!-->");
                {
                  $$renderer3.push("<!--[!-->");
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
                  $$renderer3.push(`<!--]-->`);
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]--></div>`);
        },
        tertiary: ($$renderer3) => {
          $$renderer3.push(`<div slot="tertiary" class="tertiary-content svelte-x1i5gj">`);
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
        }
      }
    });
  });
}
export {
  _page as default
};
