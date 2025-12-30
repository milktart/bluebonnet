<script lang="ts">
  import MapVisualization from './MapVisualization.svelte';
  import { onMount } from 'svelte';

  export let tripData: any = null;
  export let isPast: boolean = false;
  export let highlightedTripId: string | null = null;
  export let highlightedItemType: string | null = null;
  export let highlightedItemId: string | null = null;

  let secondarySidebarEl: HTMLElement;
  let tertiarySidebarEl: HTMLElement;
  let mapComponent: MapVisualization;

  // Export the map component so parent can access its methods
  export function getMapComponent() {
    return mapComponent;
  }

  onMount(() => {
    // Monitor sidebar content changes and hide/show accordingly
    const observer = new MutationObserver(() => {
      if (secondarySidebarEl) {
        const secondaryHasContent = secondarySidebarEl.textContent?.trim().length > 0;
        secondarySidebarEl.style.display = secondaryHasContent ? 'flex' : 'none';
      }
      if (tertiarySidebarEl) {
        const tertiaryHasContent = tertiarySidebarEl.textContent?.trim().length > 0;
        tertiarySidebarEl.style.display = tertiaryHasContent ? 'flex' : 'none';
      }
    });

    if (secondarySidebarEl) {
      observer.observe(secondarySidebarEl, { childList: true, subtree: true, characterData: true });
      const secondaryHasContent = secondarySidebarEl.textContent?.trim().length > 0;
      secondarySidebarEl.style.display = secondaryHasContent ? 'flex' : 'none';
    }

    if (tertiarySidebarEl) {
      observer.observe(tertiarySidebarEl, { childList: true, subtree: true, characterData: true });
      const tertiaryHasContent = tertiarySidebarEl.textContent?.trim().length > 0;
      tertiarySidebarEl.style.display = tertiaryHasContent ? 'flex' : 'none';
    }

    return () => observer.disconnect();
  });
</script>

<div class="map-layout">
  <!-- Full-screen Leaflet map - Always render container, component handles visibility -->
  <div id="tripMap" class="map-container">
    {#key JSON.stringify(tripData)}
      <MapVisualization bind:this={mapComponent} {tripData} {isPast} {highlightedTripId} {highlightedItemType} {highlightedItemId} />
    {/key}
  </div>

  <!-- Primary Sidebar (Left) - Always visible -->
  <aside class="primary-sidebar sidebar">
    <slot name="primary" />
  </aside>

  <!-- Secondary Sidebar (Middle) - Only visible when has content -->
  <aside bind:this={secondarySidebarEl} id="secondary-sidebar" class="secondary-sidebar sidebar">
    <slot name="secondary" />
  </aside>

  <!-- Tertiary Sidebar (Right) - Only visible when has content -->
  <aside bind:this={tertiarySidebarEl} id="tertiary-sidebar" class="tertiary-sidebar sidebar">
    <slot name="tertiary" />
  </aside>
</div>

<style>
  :global(body) {
    overflow: hidden;
    margin: 0;
    padding: 0;
  }

  .map-layout {
    position: fixed;
    width: 100%;
    height: 100vh;
    top: 0;
    left: 0;
    overflow: hidden;
    background: #f0f0f0;
  }

  .map-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
    background: transparent;
  }

  .sidebar {
    position: fixed;
    background: rgba(255, 255, 255, 0.7) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    border-radius: 0.425rem;
    border: 1px solid #e5e7eb;
    top: 2.5vh;
    bottom: 2.5vh;
    padding: 1.2rem;
  }

  /* Primary sidebar - left, fixed width */
  :global(.primary-sidebar) {
    width: 340px;
    left: 2.5vh;
    z-index: 20;
    flex-shrink: 0;
  }

  /* Secondary sidebar - default: same width as primary, no padding for forms */
  :global(.secondary-sidebar) {
    width: 340px;
    left: calc(2.5vh + 340px + 2.5vh);
    z-index: 21;
    padding: 0;
    transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Secondary sidebar full-width: takes remaining space */
  :global(.secondary-sidebar.full-width) {
    width: auto;
    right: calc(2.5vh + 340px + 2.5vh);
    left: calc(2.5vh + 340px + 2.5vh);
  }

  /* When tertiary sidebar is open, secondary shrinks to fit middle space */
  :global(.secondary-sidebar.full-width.with-tertiary) {
    left: calc(2.5vh + 340px + 2.5vh) !important;
    right: calc(2.5vh + 340px + 2.5vh + 2.5vh) !important;
    width: auto !important;
  }

  /* Tertiary sidebar - right, fixed width */
  :global(.tertiary-sidebar) {
    width: 340px;
    right: 2.5vh;
    left: auto;
    z-index: 22;
    flex-shrink: 0;
  }

  /* Responsive adjustments */
  @media (min-width: 769px) and (max-width: 1366px) {
    :global(:root) {
      --sidebar-spacing: 2vh;
      --sidebar-width: 340px;
      --sidebar-gap: 2vh;
    }

    :global(.primary-sidebar) {
      width: 340px;
      left: 2vh;
      flex-shrink: 0;
    }

    :global(.secondary-sidebar) {
      width: 340px;
      left: calc(2vh + 340px + 2vh);
    }

    :global(.secondary-sidebar.full-width) {
      width: auto;
      right: calc(2vh + 340px + 2vh);
      left: calc(2vh + 340px + 2vh);
    }

    :global(.secondary-sidebar.full-width.with-tertiary) {
      left: calc(2vh + 340px + 2vh) !important;
      right: calc(2vh + 340px + 2vh) !important;
      width: auto !important;
    }

    :global(.tertiary-sidebar) {
      width: 340px;
      right: 2vh;
      flex-shrink: 0;
    }
  }

  /* Mobile bottom sheet layout */
  @media (max-width: 768px) {
    .sidebar {
      left: 2vh !important;
      right: 2vh !important;
      width: calc(100% - 4vh) !important;
      border-radius: 0.425rem;
    }

    .primary-sidebar {
      top: 50vh;
      bottom: 2vh;
      left: 2vh;
      width: calc(100% - 4vh);
    }

    .secondary-sidebar {
      top: 5vh;
      bottom: calc(50vh + 2.5vh);
      left: 2vh;
      width: calc(100% - 4vh);
      opacity: 0;
      visibility: hidden;
      transform: translateY(100%);
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .secondary-sidebar.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .tertiary-sidebar {
      top: 5vh;
      bottom: calc(45vh + 5vh);
      left: 2vh;
      width: calc(100% - 4vh);
      opacity: 0;
      visibility: hidden;
      transform: translateY(100%);
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tertiary-sidebar.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }
</style>
