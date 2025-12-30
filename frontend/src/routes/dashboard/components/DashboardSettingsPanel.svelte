<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let user: any = null;

  const dispatch = createEventDispatcher();

  const handleSettingClick = (type: string, data: any = {}) => {
    dispatch('settingClick', { type, data });
  };
</script>

<div class="settings-main-panel">
  <div class="settings-main-content">
    <div class="settings-section">
      <h3>Account</h3>
      <button
        class="settings-item"
        on:click={() => handleSettingClick('settings-profile', user || {})}
      >
        <span class="material-symbols-outlined">person</span>
        <span>Profile</span>
      </button>
      <button class="settings-item" on:click={() => handleSettingClick('settings-security', {})}>
        <span class="material-symbols-outlined">lock</span>
        <span>Security</span>
      </button>
    </div>
    <div class="settings-section">
      <h3>Manage Vouchers & Credits</h3>
      <button class="settings-item" on:click={() => handleSettingClick('settings-vouchers', {})}>
        <span class="material-symbols-outlined">card_giftcard</span>
        <span>Vouchers & Credits</span>
      </button>
    </div>
    <div class="settings-section">
      <h3>Manage Travel Companions</h3>
      <button
        class="settings-item"
        on:click={() => handleSettingClick('settings-companions', {})}
      >
        <span class="material-symbols-outlined">people</span>
        <span>Travel Companions</span>
      </button>
    </div>
    <div class="settings-section">
      <h3>Data</h3>
      <button class="settings-item" on:click={() => handleSettingClick('settings-backup', {})}>
        <span class="material-symbols-outlined">cloud_download</span>
        <span>Backup & Export</span>
      </button>
    </div>
    <div class="settings-section">
      <h3>Account Actions</h3>
      <a href="/logout" class="settings-item logout">
        <span class="material-symbols-outlined">logout</span>
        <span>Sign Out</span>
      </a>
    </div>
  </div>
</div>

<style>
  .settings-main-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .settings-main-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 1rem;
  }

  .settings-section h3 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #111827;
  }

  .settings-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    color: #374151;
    transition: all 0.2s;
    text-decoration: none;
  }

  .settings-item:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }

  .settings-item.logout:hover {
    background: #fee2e2;
    border-color: #fecaca;
    color: #dc2626;
  }

  .settings-item :global(.material-symbols-outlined) {
    font-size: 1.25rem !important;
    flex-shrink: 0;
  }

  .settings-item span:last-child {
    font-size: 0.875rem;
    font-weight: 500;
  }
</style>
