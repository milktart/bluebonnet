<script lang="ts">
  import { goto } from '$app/navigation';
  import MapVisualization from './MapVisualization.svelte';
  import MobileTabNavigation from './MobileTabNavigation.svelte';
  import MobileTripDetailView from './MobileTripDetailView.svelte';
  import { onMount, createEventDispatcher, tick } from 'svelte';

  /**
   * ResponsiveLayout.svelte
   *
   * Unified responsive layout component - DROP-IN replacement for MapLayout
   * Desktop/Tablet: Full-screen map with floating sidebars
   * Mobile: Tab-based navigation
   */

  // Props - Trip and item data
  export let tripData: any = null;
  export let isPast: boolean = false;
  export let highlightedTripId: string | null = null;
  export let highlightedItemType: string | null = null;
  export let highlightedItemId: string | null = null;
  export let allTrips: any[] = [];

  // Mobile state
  export let mobileActiveTab: 'list' | 'add' | 'calendar' | 'settings' = 'list';
  export let mobileSelectedItem: any = null;
  export let mobileSelectedItemType: string | null = null;

  const dispatch = createEventDispatcher();

  // Component references
  let mapComponent: MapVisualization;
  let secondarySidebarEl: HTMLElement;
  let tertiarySidebarEl: HTMLElement;

  /**
   * Export map component access for parent
   */
  export function getMapComponent() {
    return mapComponent;
  }

  function handleMobileTabChange(event: any) {
    mobileActiveTab = event.detail.tabId;
  }

  async function handleMobileBack() {
    mobileSelectedItem = null;
    mobileSelectedItemType = null;
    // Navigate back to dashboard when closing mobile trip detail view
    if (typeof window !== 'undefined') {
      await goto('/dashboard', { replaceHistory: true });
    }
  }

  function handleMobileEdit(event: any) {
    dispatch('mobileEdit', event.detail);
  }

  function handleMobileDelete(event: any) {
    dispatch('mobileDelete', event.detail);
  }

  /**
   * Monitor sidebar content and map component availability
   */
  onMount(() => {
    // Monitor sidebar content changes and toggle visibility via class
    const observer = new MutationObserver(() => {
      if (secondarySidebarEl) {
        const secondaryHasContent = secondarySidebarEl.textContent?.trim().length > 0;
        secondarySidebarEl.classList.toggle('has-content', secondaryHasContent);
      }

      if (tertiarySidebarEl) {
        const tertiaryHasContent = tertiarySidebarEl.textContent?.trim().length > 0;
        tertiarySidebarEl.classList.toggle('has-content', tertiaryHasContent);
      }
    });

    if (secondarySidebarEl) {
      observer.observe(secondarySidebarEl, {
        childList: true,
        subtree: true,
        characterData: true
      });

      const secondaryHasContent = secondarySidebarEl.textContent?.trim().length > 0;
      secondarySidebarEl.classList.toggle('has-content', secondaryHasContent);
    }

    if (tertiarySidebarEl) {
      observer.observe(tertiarySidebarEl, {
        childList: true,
        subtree: true,
        characterData: true
      });

      const tertiaryHasContent = tertiarySidebarEl.textContent?.trim().length > 0;
      tertiarySidebarEl.classList.toggle('has-content', tertiaryHasContent);
    }

    return () => {
      observer.disconnect();
    };
  });
</script>

<!-- MOBILE VIEW (< 640px) - Always rendered, visibility controlled by CSS media queries only -->
<div class="mobile-layout">
  <div class="mobile-content-area">
    {#if mobileActiveTab === 'list'}
      {#if mobileSelectedItem && mobileSelectedItemType}
        <MobileTripDetailView
          {tripData}
          selectedItem={mobileSelectedItem}
          itemType={mobileSelectedItemType}
          {isPast}
          {allTrips}
          on:back={handleMobileBack}
          on:edit={handleMobileEdit}
          on:delete={handleMobileDelete}
        />
      {:else}
        <div class="mobile-list-view">
          <slot name="mobile-list" />
        </div>
      {/if}
    {:else if mobileActiveTab === 'add'}
      <div class="mobile-full-screen-view">
        <slot name="mobile-add" />
      </div>
    {:else if mobileActiveTab === 'calendar'}
      <div class="mobile-full-screen-view">
        <slot name="mobile-calendar" />
      </div>
    {:else if mobileActiveTab === 'settings'}
      <div class="mobile-full-screen-view">
        <slot name="mobile-settings" />
      </div>
    {/if}
  </div>
  <MobileTabNavigation activeTab={mobileActiveTab} on:tabChange={handleMobileTabChange} />
</div>

<!-- DESKTOP/TABLET VIEW (640px+) - Always rendered, visibility controlled by CSS media queries only -->
<div class="map-layout">
  <!-- Full-screen map background -->
  <div id="tripMap" class="map-container">
    {#key JSON.stringify(tripData)}
      <MapVisualization bind:this={mapComponent} {tripData} {isPast} {highlightedTripId} {highlightedItemType} {highlightedItemId} />
    {/key}
  </div>

  <!-- Primary Sidebar (Left) - Fixed position floating on map -->
  <aside class="primary-sidebar sidebar">
    <slot name="primary" />
  </aside>

  <!-- Secondary Sidebar (Middle/Right) - Fixed position floating on map -->
  <aside bind:this={secondarySidebarEl} id="secondary-sidebar" class="secondary-sidebar sidebar">
    <slot name="secondary" />
  </aside>

  <!-- Tertiary Sidebar (Right) - Fixed position floating on map -->
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

  /* MOBILE LAYOUT */
  .mobile-layout {
    position: fixed;
    width: 100%;
    height: 100dvh;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    background: #fff;
    overflow: hidden;
    z-index: 1;
  }

  /* Hide mobile layout on desktop/tablet (640px+) */
  @media (min-width: 640px) {
    .mobile-layout {
      display: none !important;
    }
  }

  /* Show mobile layout on mobile (< 640px) */
  @media (max-width: 639px) {
    .map-layout {
      display: none !important;
    }
  }

  .mobile-content-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
    padding-bottom: 60px;
    min-height: 0;
  }

  .mobile-list-view,
  .mobile-full-screen-view {
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  /* DESKTOP/TABLET LAYOUT */
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
    padding: 1.2rem 1.2rem .2rem;
  }

  /* Primary sidebar - left side */
  :global(.primary-sidebar) {
    width: var(--sidebar-width-primary);
    left: 2.5vh;
    z-index: 20;
    flex-shrink: 0;
  }

  /* Secondary sidebar - middle (can expand full width) */
  :global(.secondary-sidebar) {
    width: var(--sidebar-width-secondary);
    left: calc(2.5vh + var(--sidebar-width-primary) + 2.5vh);
    z-index: 21;
    padding: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Show secondary sidebar when it has content */
  :global(.secondary-sidebar.has-content) {
    opacity: 1;
    pointer-events: auto;
  }

  :global(.secondary-sidebar.full-width) {
    width: auto;
    right: calc(2.5vh + 340px + 2.5vh);
    left: calc(2.5vh + 340px + 2.5vh);
  }

  :global(.secondary-sidebar.full-width.with-tertiary) {
    left: calc(2.5vh + 340px + 2.5vh) !important;
    right: calc(2.5vh + 340px + 2.5vh) !important;
    width: auto !important;
  }

  /* Tertiary sidebar - right side */
  :global(.tertiary-sidebar) {
    width: var(--sidebar-width-tertiary);
    right: 2.5vh;
    left: auto;
    z-index: 22;
    flex-shrink: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Show tertiary sidebar when it has content */
  :global(.tertiary-sidebar.has-content) {
    opacity: 1;
    pointer-events: auto;
  }

  /* Hide/show layouts based on viewport */
  .hidden {
    display: none !important;
  }
</style>
