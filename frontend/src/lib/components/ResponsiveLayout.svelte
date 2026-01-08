<script lang="ts">
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

  // Mobile state (backward compatibility)
  export let mobileActiveTab: 'list' | 'add' | 'calendar' | 'settings' = 'list';
  export let mobileSelectedItem: any = null;
  export let mobileSelectedItemType: string | null = null;

  const dispatch = createEventDispatcher();

  // Component references
  let mapComponent: MapVisualization;
  let secondarySidebarEl: HTMLElement;
  let tertiarySidebarEl: HTMLElement;
  let isMobileView = false;

  /**
   * Export map component access for parent
   */
  export function getMapComponent() {
    return mapComponent;
  }

  function handleMobileTabChange(event: any) {
    mobileActiveTab = event.detail.tabId;
  }

  function handleMobileBack() {
    mobileSelectedItem = null;
    mobileSelectedItemType = null;
  }

  function handleMobileEdit(event: any) {
    dispatch('mobileEdit', event.detail);
  }

  function handleMobileDelete(event: any) {
    dispatch('mobileDelete', event.detail);
  }

  /**
   * Monitor window resize and sidebar content changes
   */
  onMount(() => {
    // Update mobile view state and reset mobile state if transitioning to desktop
    const handleResize = () => {
      const wasViewingMobile = isMobileView;
      isMobileView = window.innerWidth < 640;

      if (!isMobileView && mobileSelectedItem) {
        mobileSelectedItem = null;
        mobileSelectedItemType = null;
      }

      // When transitioning from mobile to desktop, trigger map resize
      if (wasViewingMobile && !isMobileView) {
        // Trigger map resize to recalculate bounds after layout changes
        if (mapComponent?.mapInstance) {
          mapComponent.mapInstance.invalidateSize();
        }
      }
    };

    // Check initial viewport
    handleResize();

    // Monitor sidebar content and toggle visibility via inline styles
    const observer = new MutationObserver(() => {
      if (secondarySidebarEl) {
        const secondaryHasContent = secondarySidebarEl.textContent?.trim().length > 0;
        secondarySidebarEl.style.opacity = secondaryHasContent ? '1' : '0';
        secondarySidebarEl.style.pointerEvents = secondaryHasContent ? 'auto' : 'none';
      }

      if (tertiarySidebarEl) {
        const tertiaryHasContent = tertiarySidebarEl.textContent?.trim().length > 0;
        tertiarySidebarEl.style.opacity = tertiaryHasContent ? '1' : '0';
        tertiarySidebarEl.style.pointerEvents = tertiaryHasContent ? 'auto' : 'none';
      }
    });

    if (secondarySidebarEl) {
      observer.observe(secondarySidebarEl, {
        childList: true,
        subtree: true,
        characterData: true
      });

      const secondaryHasContent = secondarySidebarEl.textContent?.trim().length > 0;
      secondarySidebarEl.style.opacity = secondaryHasContent ? '1' : '0';
      secondarySidebarEl.style.pointerEvents = secondaryHasContent ? 'auto' : 'none';
    }

    if (tertiarySidebarEl) {
      observer.observe(tertiarySidebarEl, {
        childList: true,
        subtree: true,
        characterData: true
      });

      const tertiaryHasContent = tertiarySidebarEl.textContent?.trim().length > 0;
      tertiarySidebarEl.style.opacity = tertiaryHasContent ? '1' : '0';
      tertiarySidebarEl.style.pointerEvents = tertiaryHasContent ? 'auto' : 'none';
    }

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<!-- MOBILE VIEW (< 640px) - Always rendered, visibility controlled by CSS -->
<div class="mobile-layout" class:hidden={!isMobileView}>
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

<!-- DESKTOP/TABLET VIEW (640px+) - Always rendered, visibility controlled by CSS -->
<div class="map-layout" class:hidden={isMobileView}>
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
    padding: 1.2rem;
  }

  /* Primary sidebar - left side */
  :global(.primary-sidebar) {
    width: 340px;
    left: 2.5vh;
    z-index: 20;
    flex-shrink: 0;
  }

  /* Secondary sidebar - middle (can expand full width) */
  :global(.secondary-sidebar) {
    width: 340px;
    left: calc(2.5vh + 340px + 2.5vh);
    z-index: 21;
    padding: 0;
    transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
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
    width: 340px;
    right: 2.5vh;
    left: auto;
    z-index: 22;
    flex-shrink: 0;
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Hide/show layouts based on viewport */
  .hidden {
    display: none !important;
  }
</style>
