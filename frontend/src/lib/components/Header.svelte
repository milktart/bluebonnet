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
    padding: max(0.5rem, env(safe-area-inset-top, 0.5rem)) max(1rem, env(safe-area-inset-right, 1rem)) 0.5rem max(1rem, env(safe-area-inset-left, 1rem));
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem);
  }

  .logo-link {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .logo-text {
    font-size: clamp(1.25rem, 4vw, 1.75rem);
    font-weight: 700;
    color: #333;
    display: flex;
    align-items: center;
    gap: clamp(0.25rem, 1vw, 0.5rem);
    white-space: nowrap;
  }

  :global(.logo-icon) {
    font-size: 1.75rem !important;
    color: #e91e63;
    flex-shrink: 0;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 2rem);
    list-style: none;
  }

  .nav-link {
    color: #666;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
    cursor: pointer;
    padding: 0.5rem 0;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .nav-link:hover {
    color: #007bff;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: clamp(0.75rem, 2vw, 1rem);
    border-left: 1px solid #e0e0e0;
    padding-left: clamp(0.75rem, 2vw, 1rem);
  }

  .user-name {
    color: #333;
    font-weight: 500;
    font-size: clamp(0.875rem, 2vw, 1rem);
  }

  .menu-toggle {
    display: none;
    flex-direction: column;
    background: none;
    border: none;
    cursor: pointer;
    gap: 0.4rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem;
    justify-content: center;
    align-items: center;
  }

  .hamburger {
    width: 24px;
    height: 2px;
    background: #333;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  /* Mobile (0-479px) - Optimized for small screens */
  @media (max-width: 479px) {
    .header-content {
      padding: 0.75rem 1rem;
      gap: 1rem;
    }

    .logo-text {
      font-size: 1.25rem;
    }

    :global(.logo-icon) {
      font-size: 1.5rem !important;
    }

    .menu-toggle {
      display: flex;
    }

    .nav {
      position: fixed;
      top: 100%;
      left: 0;
      right: 0;
      flex-direction: column;
      gap: 0.5rem;
      background: white;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      z-index: 50;
    }

    .nav.mobile-open {
      max-height: calc(100dvh - 100%);
    }

    .nav-link {
      padding: 0.75rem;
      min-height: 44px;
    }

    .user-info {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
      border-left: none;
      padding-left: 0;
      width: 100%;
    }
  }

  /* Small mobile (480-639px) - Still responsive */
  @media (min-width: 480px) and (max-width: 639px) {
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
      padding: 1rem;
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
      gap: 0.75rem;
      border-left: none;
      padding-left: 0;
      width: 100%;
    }

    .nav-link {
      display: block;
      padding: 0.75rem 0;
    }
  }

  /* Tablet (640-1023px) - Side by side still fits */
  @media (min-width: 640px) and (max-width: 1023px) {
    .header-content {
      padding: 1rem;
    }
  }

  /* Desktop (1024px+) - Full spacing */
  @media (min-width: 1024px) {
    .nav-link {
      min-height: auto;
    }
  }

  /* Landscape mode */
  @media (max-height: 600px) {
    .header {
      padding-top: 0.25rem;
    }

    .header-content {
      padding: 0.5rem 1rem;
    }

    .logo-text {
      font-size: 1.125rem;
    }

    .nav-link {
      min-height: 40px;
      font-size: 0.875rem;
    }

    .menu-toggle {
      min-height: 40px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .hamburger,
    .nav {
      transition: none;
    }
  }
</style>
