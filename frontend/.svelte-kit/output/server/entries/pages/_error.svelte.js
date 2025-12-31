import { $ as sanitize_slots, a0 as fallback, a1 as attr_class, a2 as escape_html, Z as slot, a3 as bind_props, Y as head, a4 as stringify, X as store_get, _ as unsubscribe_stores } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import { B as Button } from "../../chunks/Button.js";
function Card($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  let title = fallback($$props["title"], "");
  let subtitle = fallback($$props["subtitle"], "");
  let clickable = fallback($$props["clickable"], false);
  $$renderer.push(`<div${attr_class("card svelte-1udyrqm", void 0, { "clickable": clickable })}>`);
  if (title || subtitle || $$slots.indicators) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="card-header svelte-1udyrqm"><div class="header-content svelte-1udyrqm">`);
    if (title) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<h3 class="svelte-1udyrqm">${escape_html(title)}</h3>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--> `);
    if (subtitle) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<p class="subtitle svelte-1udyrqm">${escape_html(subtitle)}</p>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></div> `);
    if ($$slots.indicators) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<div class="header-indicators svelte-1udyrqm"><!--[-->`);
      slot($$renderer, $$props, "indicators", {});
      $$renderer.push(`<!--]--></div>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> <div class="card-body svelte-1udyrqm"><!--[-->`);
  slot($$renderer, $$props, "default", {});
  $$renderer.push(`<!--]--></div> `);
  if ($$slots.footer) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="card-footer svelte-1udyrqm"><!--[-->`);
    slot($$renderer, $$props, "footer", {});
    $$renderer.push(`<!--]--></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div>`);
  bind_props($$props, { title, subtitle, clickable });
}
function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    head("1j96wlh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Error - Bluebonnet</title>`);
      });
    });
    $$renderer2.push(`<div class="error-container svelte-1j96wlh">`);
    Card($$renderer2, {
      title: "Oops! Something went wrong",
      subtitle: `Error ${stringify(store_get($$store_subs ??= {}, "$page", page).status)}`,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="error-content svelte-1j96wlh"><p class="error-message svelte-1j96wlh">`);
        if (store_get($$store_subs ??= {}, "$page", page).status === 404) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`The page you're looking for doesn't exist.`);
        } else {
          $$renderer3.push("<!--[!-->");
          if (store_get($$store_subs ??= {}, "$page", page).status === 500) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`We encountered an internal server error. Please try again later.`);
          } else {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push(`An unexpected error occurred. Please try again.`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></p> <div class="error-actions svelte-1j96wlh">`);
        Button($$renderer3, {
          variant: "primary",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->Go to Home`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Button($$renderer3, {
          variant: "secondary",
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->Go Back`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></div></div>`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _error as default
};
