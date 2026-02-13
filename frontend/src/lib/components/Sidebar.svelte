<script lang="ts">
  export let isOpen = false;

  interface SidebarItem {
    label: string;
    href: string;
    icon?: string;
    active?: boolean;
  }

  export let items: SidebarItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Trips', href: '/trips', icon: 'flight' },
    { label: 'Companions', href: '/companions', icon: 'groups' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ];

  function closeMenu() {
    isOpen = false;
  }
</script>

<aside class="sidebar" class:open={isOpen}>
  <nav class="sidebar-nav">
    {#each items as item (item.href)}
      <a
        href={item.href}
        on:click={closeMenu}
        class="sidebar-item"
        class:active={item.active}
      >
        {#if item.icon}
          <span class="material-symbols-outlined sidebar-icon">{item.icon}</span>
        {/if}
        <span class="sidebar-label">{item.label}</span>
      </a>
    {/each}
  </nav>
</aside>

<style>
  .sidebar {
    width: 250px;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border-light);
    padding: 1.2rem 1.2rem .2rem;
    max-height: calc(100vh - 64px);
    overflow-y: auto;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .sidebar-item:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
  }

  .sidebar-item.active {
    background: var(--color-primary);
    color: white;
    border-left: 4px solid var(--color-primary-active);
    padding-left: calc(1.5rem - 4px);
  }

  .sidebar-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .sidebar-label {
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: -250px;
      top: 64px;
      height: calc(100vh - 64px);
      z-index: 50;
      transition: left 0.3s ease;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }

    .sidebar.open {
      left: 0;
    }
  }
</style>
