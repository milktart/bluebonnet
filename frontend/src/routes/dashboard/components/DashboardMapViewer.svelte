<script lang="ts">
  import { dashboardStore, dashboardStoreActions } from '$lib/stores/dashboardStore';
  import DashboardCalendar from '$lib/components/DashboardCalendar.svelte';

  let tertiarySidebarContent: { type: string; data: any } | null = null;
  let trips: any[] = [];
  let activeTab: 'upcoming' | 'past' = 'upcoming';

  // Subscribe to store
  const unsubscribe = dashboardStore.subscribe(($store) => {
    tertiarySidebarContent = $store.tertiarySidebarContent;
    trips = $store.trips;
    activeTab = $store.activeTab;
  });

  const handleClose = () => {
    dashboardStoreActions.closeTertiarySidebar();
  };
</script>

<div slot="tertiary" class="tertiary-content">
  {#if tertiarySidebarContent?.type === 'calendar'}
    <div class="tertiary-header">
      <h2>Calendar</h2>
      <button class="close-btn" on:click={handleClose} title="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="tertiary-body">
      <DashboardCalendar {trips} {activeTab} />
    </div>
  {:else if tertiarySidebarContent}
    <div class="tertiary-header">
      <h2>{tertiarySidebarContent.type}</h2>
      <button class="close-btn" on:click={handleClose} title="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="tertiary-body">
      <p>Details for {tertiarySidebarContent.type}</p>
    </div>
  {/if}
</div>

<style>
  .tertiary-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    overflow-y: auto;
  }

  .tertiary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .tertiary-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .close-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6b7280;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #111827;
  }

  .tertiary-body {
    flex: 1;
    overflow-y: auto;
  }
</style>
