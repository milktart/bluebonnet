<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ItemEditForm from '$lib/components/ItemEditForm.svelte';
  import DashboardCalendar from '$lib/components/DashboardCalendar.svelte';
  import SettingsProfile from '$lib/components/SettingsProfile.svelte';
  import SettingsSecurity from '$lib/components/SettingsSecurity.svelte';
  import SettingsVouchers from '$lib/components/SettingsVouchers.svelte';
  import SettingsCompanions from '$lib/components/SettingsCompanions.svelte';
  import SettingsBackup from '$lib/components/SettingsBackup.svelte';

  export let secondarySidebarContent: { type: string; itemType?: string; data: any } | null = null;
  export let trips: any[] = [];
  export let standaloneItems: any = {};

  const dispatch = createEventDispatcher();

  const closeSecondarySidebar = () => {
    dispatch('close');
  };

  const handleItemSave = async (item: any) => {
    dispatch('save', item);
  };

  const handleNewTripClick = () => {
    dispatch('newTrip');
  };

  const handleNewItemClick = (itemType: string) => {
    dispatch('newItem', { itemType });
  };

  const handleTertiarySidebarAction = (action: string, detail: any) => {
    dispatch('tertiarySidebarAction', { action, detail });
  };

  function shouldBeFullWidth() {
    if (!secondarySidebarContent) return false;
    const type = secondarySidebarContent.type;
    return (
      type === 'calendar' ||
      type === 'settings-vouchers' ||
      type === 'settings-companions' ||
      type === 'settings-backup'
    );
  }
</script>

<div class="secondary-content" class:full-width={shouldBeFullWidth()}>
  {#if secondarySidebarContent?.type === 'calendar'}
    <!-- Calendar View -->
    <div class="calendar-sidebar-container">
      <div class="calendar-sidebar-header">
        <h2>Calendar</h2>
        <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <DashboardCalendar {trips} {standaloneItems} onItemClick={(e) => dispatch('itemClick', e)} />
    </div>
  {:else if secondarySidebarContent?.type === 'settings-profile'}
    <div class="settings-panel">
      <div class="settings-panel-header">
        <h2>Profile</h2>
        <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="settings-panel-content">
        <SettingsProfile data={secondarySidebarContent?.data} />
      </div>
    </div>
  {:else if secondarySidebarContent?.type === 'settings-security'}
    <div class="settings-panel">
      <div class="settings-panel-header">
        <h2>Security</h2>
        <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="settings-panel-content">
        <SettingsSecurity />
      </div>
    </div>
  {:else if secondarySidebarContent?.type === 'settings-vouchers'}
    <div class="calendar-sidebar-container">
      <div class="calendar-sidebar-header">
        <h2>Vouchers & Credits</h2>
        <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <SettingsVouchers
        onEditVoucher={(voucher) => handleTertiarySidebarAction('edit-voucher', { voucher })}
        onAddVoucher={() => handleTertiarySidebarAction('add-voucher', {})}
      />
    </div>
  {:else if secondarySidebarContent?.type === 'settings-companions'}
    <div class="calendar-sidebar-container">
      <div class="calendar-sidebar-header">
        <h2>Travel Companions</h2>
        <div class="header-actions">
          <button
            class="add-companion-btn"
            on:click={() => handleTertiarySidebarAction('add-companion', {})}
            title="Add Companion"
          >
            <span class="material-symbols-outlined">group_add</span>
          </button>
          <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      <SettingsCompanions />
    </div>
  {:else if secondarySidebarContent?.type === 'settings-backup'}
    <div class="calendar-sidebar-container">
      <div class="calendar-sidebar-header">
        <h2>Backup & Export</h2>
        <button class="close-btn" on:click={closeSecondarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <SettingsBackup />
    </div>
  {:else if secondarySidebarContent?.type === 'newItemMenu'}
    <!-- New Item Menu -->
    <div class="new-item-menu">
      <div class="menu-header">
        <h2 class="menu-title">Add New Item</h2>
        <button class="close-menu-btn" on:click={closeSecondarySidebar} title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="menu-items">
        <!-- Add Trip Option -->
        <button class="menu-item" on:click={handleNewTripClick}>
          <div class="menu-item-icon amber">
            <span class="material-symbols-outlined">flight</span>
          </div>
          <div class="menu-item-content">
            <h3>Trip</h3>
            <p>Plan a complete trip with dates</p>
          </div>
          <span class="material-symbols-outlined menu-arrow">chevron_right</span>
        </button>

        <!-- Divider -->
        <div class="menu-divider">
          <span>or add a single item</span>
        </div>

        <!-- Add Flight Option -->
        <button class="menu-item" on:click={() => handleNewItemClick('flight')}>
          <div class="menu-item-icon blue">
            <span class="material-symbols-outlined">flight</span>
          </div>
          <div class="menu-item-content">
            <h3>Flight</h3>
            <p>Add a flight booking</p>
          </div>
          <span class="material-symbols-outlined menu-arrow">chevron_right</span>
        </button>

        <!-- Add Hotel Option -->
        <button class="menu-item" on:click={() => handleNewItemClick('hotel')}>
          <div class="menu-item-icon green">
            <span class="material-symbols-outlined">hotel</span>
          </div>
          <div class="menu-item-content">
            <h3>Hotel</h3>
            <p>Add a hotel or accommodation</p>
          </div>
          <span class="material-symbols-outlined menu-arrow">chevron_right</span>
        </button>

        <!-- Add Transportation Option -->
        <button class="menu-item" on:click={() => handleNewItemClick('transportation')}>
          <div class="menu-item-icon red">
            <span class="material-symbols-outlined">train</span>
          </div>
          <div class="menu-item-content">
            <h3>Transportation</h3>
            <p>Train, bus, taxi, or other transit</p>
          </div>
          <span class="material-symbols-outlined menu-arrow">chevron_right</span>
        </button>

        <!-- Add Car Rental Option -->
        <button class="menu-item" on:click={() => handleNewItemClick('carRental')}>
          <div class="menu-item-icon gray">
            <span class="material-symbols-outlined">directions_car</span>
          </div>
          <div class="menu-item-content">
            <h3>Car Rental</h3>
            <p>Add a car rental booking</p>
          </div>
          <span class="material-symbols-outlined menu-arrow">chevron_right</span>
        </button>

        <!-- Add Event Option -->
        <button class="menu-item" on:click={() => handleNewItemClick('event')}>
          <div class="menu-item-icon purple">
            <span class="material-symbols-outlined">event</span>
          </div>
          <div class="menu-item-content">
            <h3>Event</h3>
            <p>Concert, conference, or activity</p>
          </div>
          <span class="material-symbols-outlined menu-arrow">chevron_right</span>
        </button>
      </div>
    </div>
  {:else if secondarySidebarContent}
    <ItemEditForm
      itemType={secondarySidebarContent.itemType || secondarySidebarContent.type}
      data={secondarySidebarContent.data}
      tripId={secondarySidebarContent.data?.tripId || ''}
      allTrips={trips}
      onClose={closeSecondarySidebar}
      onSave={handleItemSave}
    />
  {/if}
</div>

<style>
  .secondary-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    padding: 0;
  }

  .secondary-content.full-width {
    padding: 0;
  }

  .calendar-sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
  }

  .calendar-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .calendar-sidebar-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .add-companion-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #2563eb;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-companion-btn:hover {
    background: #dbeafe;
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

  /* Settings Panel */
  .settings-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
  }

  .settings-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin: 0 0 0.75rem;
  }

  .settings-panel-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .settings-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* New Item Menu */
  .new-item-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 1rem 0;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    margin-bottom: 1rem;
  }

  .menu-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .close-menu-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6b7280;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .close-menu-btn:hover {
    background: #f3f4f6;
    color: #111827;
  }

  .menu-items {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .menu-item:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .menu-item-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    flex-shrink: 0;
  }

  .menu-item-icon.blue {
    background: #3b82f6;
  }

  .menu-item-icon.green {
    background: #10b981;
  }

  .menu-item-icon.red {
    background: #ef4444;
  }

  .menu-item-icon.amber {
    background: #f59e0b;
  }

  .menu-item-icon.gray {
    background: #6b7280;
  }

  .menu-item-icon.purple {
    background: #a855f7;
  }

  .menu-item-content {
    flex: 1;
    text-align: left;
  }

  .menu-item-content h3 {
    margin: 0 0 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  .menu-item-content p {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .menu-arrow {
    color: #d1d5db;
    flex-shrink: 0;
  }

  .menu-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
    color: #9ca3af;
    font-size: 0.875rem;
  }

  .menu-divider::before,
  .menu-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  /* ItemEditForm wrapper padding */
  :global(.secondary-content :global(.edit-panel)) {
    padding: 1rem;
  }
</style>
