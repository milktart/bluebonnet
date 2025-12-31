<script lang="ts">
  import { authStore, authStoreActions } from '$lib/stores/authStore';
  import Button from './Button.svelte';

  let isMenuOpen = false;

  function handleLogout() {
    authStoreActions.logout();
    window.location.href = '/';
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  function handleNavClick(href: string) {
    window.location.href = href;
    closeMenu();
  }

  function handleDashboardClick() {
    window.location.href = '/dashboard';
  }
</script>

<header class="header">
  <div class="header-content">
    <div class="logo">
      <a href="/" class="logo-link">
        <span class="logo-text">
          <span class="material-symbols-outlined logo-icon">favorite</span>
          Bluebonnet
        </span>
      </a>
    </div>

    <nav class="nav" class:mobile-open={isMenuOpen}>
      {#if $authStore.isAuthenticated}
        <a href="/dashboard" on:click={closeMenu} class="nav-link">Dashboard</a>
        <a href="/account" on:click={closeMenu} class="nav-link">Account</a>
        <div class="user-info">
          <span class="user-name">
            {$authStore.user?.firstName || 'User'}
          </span>
          <Button
            variant="secondary"
            size="small"
            on:click={handleLogout}
          >
            Logout
          </Button>
        </div>
      {:else}
        <a href="/login" on:click={closeMenu} class="nav-link">Login</a>
        <a href="/register" on:click={closeMenu} class="nav-link">Register</a>
      {/if}
    </nav>

    <button class="menu-toggle" on:click={toggleMenu} aria-label="Toggle menu">
      <span class="hamburger"></span>
      <span class="hamburger"></span>
      <span class="hamburger"></span>
    </button>
  </div>
</header>

<style>
  .header {
    background: white;
    border-bottom: 1px solid #e0e0e0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
  }

  .logo-link {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global(.logo-icon) {
    font-size: 1.75rem !important;
    color: #e91e63;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 2rem;
    list-style: none;
  }

  .nav-link {
    color: #666;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
    cursor: pointer;
  }

  .nav-link:hover {
    color: #007bff;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    border-left: 1px solid #e0e0e0;
    padding-left: 1rem;
  }

  .user-name {
    color: #333;
    font-weight: 500;
  }

  .menu-toggle {
    display: none;
    flex-direction: column;
    background: none;
    border: none;
    cursor: pointer;
    gap: 0.4rem;
  }

  .hamburger {
    width: 24px;
    height: 2px;
    background: #333;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    .menu-toggle {
      display: flex;
    }

    .nav {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      flex-direction: column;
      gap: 0.5rem;
      background: white;
      padding: 1rem 2rem;
      border-bottom: 1px solid #e0e0e0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .nav.mobile-open {
      max-height: 500px;
    }

    .user-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      border-left: none;
      padding-left: 0;
      width: 100%;
    }

    .nav-link {
      display: block;
      padding: 0.5rem 0;
    }
  }
</style>
