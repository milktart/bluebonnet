import { X as store_get, Y as head, Z as slot, _ as unsubscribe_stores } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import "clsx";
/* empty css                                                   */
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isMapView;
    isMapView = store_get($$store_subs ??= {}, "$page", page).route.id?.startsWith("/(map)") || store_get($$store_subs ??= {}, "$page", page).route.id === "/trips/map" || store_get($$store_subs ??= {}, "$page", page).route.id?.includes("[tripId]");
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Bluebonnet - Travel Planner</title>`);
      });
      $$renderer3.push(`<meta name="viewport" content="width=device-width, initial-scale=1"/> <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"/> <script src="https://cdn.tailwindcss.com"><\/script>`);
    });
    if (isMapView) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="app-wrapper svelte-12qhfyh"><main class="main-content svelte-12qhfyh"><!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--></main></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
