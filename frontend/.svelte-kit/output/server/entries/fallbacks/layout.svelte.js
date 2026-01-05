import { F as FILENAME } from "../../chunks/index-client.js";
import "clsx";
Layout[FILENAME] = "node_modules/@sveltejs/kit/src/runtime/components/svelte-5/layout.svelte";
function Layout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { children } = $$props;
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    },
    Layout
  );
}
Layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  Layout as default
};
