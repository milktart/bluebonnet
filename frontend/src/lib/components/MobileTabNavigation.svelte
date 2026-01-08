<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let activeTab: 'list' | 'add' | 'calendar' | 'settings' = 'list';
  export let unreadCount: number = 0;

  const dispatch = createEventDispatcher();

  const tabs = [
    { id: 'list', label: 'Trips', icon: 'format_list_bulleted', title: 'View all trips and items' },
    { id: 'add', label: 'Add', icon: 'add', title: 'Create new trip or item' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month', title: 'Calendar view' },
    { id: 'settings', label: 'Settings', icon: 'settings', title: 'Account settings' },
  ] as const;

  function handleTabClick(tabId: 'list' | 'add' | 'calendar' | 'settings') {
    activeTab = tabId;
    dispatch('tabChange', { tabId });
  }
</script>

<nav class="mobile-tab-navigation" role="tablist" aria-label="Main navigation tabs">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-label={tab.title}
      class="tab-button"
      class:active={activeTab === tab.id}
      on:click={() => handleTabClick(tab.id)}
      title={tab.title}
    >
      <span class="tab-icon material-symbols-outlined">{tab.icon}</span>
      <span class="tab-label">{tab.label}</span>
    </button>
  {/each}
</nav>

<style>
  .mobile-tab-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0px));
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    width: 100%;
    box-sizing: border-box;
  }

  .tab-button {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    padding-top: clamp(0.5rem, 2vw, 0.75rem);
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    color: #6b7280;
    text-decoration: none;
    min-height: 44px;
    -webkit-user-select: none;
    user-select: none;
  }

  /* Landscape mode: add top padding for visual balance */
  @media (max-height: 600px) {
    .tab-button {
      padding-top: 0.75rem;
    }
  }

  .tab-button:active {
    background: rgba(0, 0, 0, 0.05);
  }

  .tab-button.active {
    color: #2563eb;
  }

  .tab-icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .tab-label {
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
  }

  /* Accessibility: High contrast mode support */
  @media (prefers-contrast: more) {
    .mobile-tab-navigation {
      border-top: 2px solid #000;
    }

    .tab-button {
      border-right: 1px solid #d1d5db;
    }

    .tab-button:last-child {
      border-right: none;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .tab-button {
      transition: none;
    }
  }

  /* Landscape mode - reduce height slightly */
  @media (max-height: 600px) {
    .mobile-tab-navigation {
      height: 50px;
    }

    .tab-icon {
      font-size: 1.25rem;
    }

    .tab-label {
      font-size: 0.5rem;
    }
  }

  /* Tablet and desktop - hide (use MapLayout sidebars instead) */
  /* Only hide on actual desktop/tablet, not on landscape phones */
  @media (min-width: 640px) and (min-height: 600px) {
    .mobile-tab-navigation {
      display: none;
    }
  }
</style>
