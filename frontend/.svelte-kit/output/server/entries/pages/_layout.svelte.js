import { Y as store_get, Z as head, _ as slot, $ as unsubscribe_stores } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import { p as push_element, a as pop_element } from "../../chunks/dev.js";
import { F as FILENAME } from "../../chunks/index-client.js";
import "../../chunks/MapLayout.js";
_layout[FILENAME] = "src/routes/+layout.svelte";
function _layout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      let isMapView;
      isMapView = store_get($$store_subs ??= {}, "$page", page).route.id?.startsWith("/(map)") || store_get($$store_subs ??= {}, "$page", page).route.id === "/trips/map" || store_get($$store_subs ??= {}, "$page", page).route.id?.includes("[tripId]");
      head("12qhfyh", $$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Bluebonnet - Travel Planner</title>`);
        });
        $$renderer3.push(`<meta name="viewport" content="width=device-width, initial-scale=1"/>`);
        push_element($$renderer3, "meta", 21, 2);
        pop_element();
        $$renderer3.push(` <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"/>`);
        push_element($$renderer3, "link", 22, 2);
        pop_element();
        $$renderer3.push(` <script src="https://cdn.tailwindcss.com"><\/script>`);
      });
      if (isMapView) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="app-wrapper svelte-12qhfyh">`);
        push_element($$renderer2, "div", 31, 2);
        $$renderer2.push(`<main class="main-content svelte-12qhfyh">`);
        push_element($$renderer2, "main", 32, 4);
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]--></main>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]-->`);
      if ($$store_subs) unsubscribe_stores($$store_subs);
    },
    _layout
  );
}
_layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _layout as default
};
