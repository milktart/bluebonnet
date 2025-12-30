<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Alert from '$lib/components/Alert.svelte';

  export let activeView: 'trips' | 'settings' = 'trips';
  export let activeTab: 'upcoming' | 'past' = 'upcoming';
  export let error: string | null = null;

  const dispatch = createEventDispatcher();

  const handleCalendarClick = () => {
    dispatch('calendarClick');
  };

  const handleCreateTrip = () => {
    dispatch('createTrip');
  };

  const handleTabChange = (tab: 'upcoming' | 'past') => {
    dispatch('tabChange', tab);
  };

  const handleViewChange = (view: 'trips' | 'settings') => {
    dispatch('viewChange', view);
  };
</script>

<div class="header-section">
  <div class="header-top">
    <h1>My Trips</h1>
    <div class="header-buttons">
      <button class="icon-btn" title="View calendar" on:click={handleCalendarClick}>
        <span class="material-symbols-outlined">calendar_month</span>
      </button>
      <button class="add-btn" title="Add new trip" on:click={handleCreateTrip}>
        <span class="material-symbols-outlined">add</span>
      </button>
    </div>
  </div>

  {#if error}
    <Alert type="error" message={error} dismissible on:close={() => (error = null)} />
  {/if}

  <nav class="tabs">
    <div class="tabs-left">
      <button
        class="tab-btn"
        class:active={activeView === 'trips' && activeTab === 'upcoming'}
        on:click={() => {
          handleViewChange('trips');
          handleTabChange('upcoming');
        }}
      >
        Upcoming
      </button>
      <button
        class="tab-btn"
        class:active={activeView === 'trips' && activeTab === 'past'}
        on:click={() => {
          handleViewChange('trips');
          handleTabChange('past');
        }}
      >
        Past
      </button>
    </div>
    <button
      class="tab-btn settings-btn"
      class:active={activeView === 'settings'}
      title="Settings"
      on:click={() => handleViewChange('settings')}
    >
      <span class="material-symbols-outlined" style="font-size: 1.1rem;">settings</span>
    </button>
  </nav>
</div>

<style>
  .header-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  .header-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .icon-btn,
  .add-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
  }

  .icon-btn:hover {
    background: #f3f4f6;
  }

  .add-btn:hover {
    background: #dbeafe;
  }

  .add-btn {
    background: #f3f4f6;
  }

  :global(.material-symbols-outlined) {
    font-size: 1.25rem;
  }

  .tabs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    border-bottom: 2px solid #e5e7eb;
  }

  .tabs-left {
    display: flex;
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: 600;
    color: #6b7280;
    font-size: 0.875rem;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tab-btn:hover {
    color: #111827;
  }

  .tab-btn.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
  }

  .settings-btn {
    margin-left: auto;
    padding: 0.5rem;
    border-radius: 0.375rem;
  }

  .settings-btn:hover {
    background: #f3f4f6;
  }
</style>
