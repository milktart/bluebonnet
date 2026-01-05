import { a0 as sanitize_slots, a1 as fallback, a2 as attr_class, a3 as escape_html, _ as slot, a4 as bind_props, Z as head, X as prevent_snippet_stringification, a5 as stringify, Y as store_get, $ as unsubscribe_stores } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import { B as Button } from "../../chunks/Button.js";
import { p as push_element, a as pop_element } from "../../chunks/dev.js";
import { F as FILENAME } from "../../chunks/index-client.js";
Card[FILENAME] = "src/lib/components/Card.svelte";
function Card($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  $$renderer.component(
    ($$renderer2) => {
      let title = fallback($$props["title"], "");
      let subtitle = fallback($$props["subtitle"], "");
      let clickable = fallback($$props["clickable"], false);
      $$renderer2.push(`<div${attr_class("card svelte-1udyrqm", void 0, { "clickable": clickable })}>`);
      push_element($$renderer2, "div", 7, 0);
      if (title || subtitle || $$slots.indicators) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="card-header svelte-1udyrqm">`);
        push_element($$renderer2, "div", 9, 4);
        $$renderer2.push(`<div class="header-content svelte-1udyrqm">`);
        push_element($$renderer2, "div", 10, 6);
        if (title) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<h3 class="svelte-1udyrqm">`);
          push_element($$renderer2, "h3", 12, 10);
          $$renderer2.push(`${escape_html(title)}</h3>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (subtitle) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="subtitle svelte-1udyrqm">`);
          push_element($$renderer2, "p", 15, 10);
          $$renderer2.push(`${escape_html(subtitle)}</p>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(` `);
        if ($$slots.indicators) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="header-indicators svelte-1udyrqm">`);
          push_element($$renderer2, "div", 19, 8);
          $$renderer2.push(`<!--[-->`);
          slot($$renderer2, $$props, "indicators", {});
          $$renderer2.push(`<!--]--></div>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="card-body svelte-1udyrqm">`);
      push_element($$renderer2, "div", 26, 2);
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      if ($$slots.footer) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="card-footer svelte-1udyrqm">`);
        push_element($$renderer2, "div", 31, 4);
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "footer", {});
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { title, subtitle, clickable });
    },
    Card
  );
}
Card.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_error[FILENAME] = "src/routes/+error.svelte";
function _error($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      head("1j96wlh", $$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Error - Bluebonnet</title>`);
        });
      });
      $$renderer2.push(`<div class="error-container svelte-1j96wlh">`);
      push_element($$renderer2, "div", 11, 0);
      Card($$renderer2, {
        title: "Oops! Something went wrong",
        subtitle: `Error ${stringify(store_get($$store_subs ??= {}, "$page", page).status)}`,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<div class="error-content svelte-1j96wlh">`);
          push_element($$renderer3, "div", 13, 4);
          $$renderer3.push(`<p class="error-message svelte-1j96wlh">`);
          push_element($$renderer3, "p", 14, 6);
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
          $$renderer3.push(`<!--]--></p>`);
          pop_element();
          $$renderer3.push(` <div class="error-actions svelte-1j96wlh">`);
          push_element($$renderer3, "div", 24, 6);
          Button($$renderer3, {
            variant: "primary",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Go to Home`);
            }),
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            variant: "secondary",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Go Back`);
            }),
            $$slots: { default: true }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        }),
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      if ($$store_subs) unsubscribe_stores($$store_subs);
    },
    _error
  );
}
_error.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _error as default
};
