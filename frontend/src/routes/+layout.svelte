<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { authStore, authStoreActions } from '$lib/stores/authStore';
  import MapLayout from '$lib/components/MapLayout.svelte';

  // Check if current page is a map-based route
  $: isMapView = $page.route.id?.startsWith('/(map)') ||
                 $page.route.id === '/trips/map' ||
                 $page.route.id?.includes('[tripId]');

  onMount(() => {
    // Restore authentication state from localStorage on app load
    // This ensures the user stays logged in even after page refresh
    authStoreActions.restoreFromStorage();
  });
</script>

<svelte:head>
  <title>Bluebonnet - Travel Planner</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link href="https://cdn.tailwindcss.com" rel="stylesheet" />
</svelte:head>

<!-- Map-based UI for all trip-related views -->
{#if isMapView}
  <slot />
{:else}
  <!-- Standard layout for auth pages -->
  <div class="app-wrapper">
    <main class="main-content">
      <slot />
    </main>
  </div>
{/if}

<style global>
  :global(* ) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #ffffff;
    color: #333;
    overflow-x: hidden;
  }

  :global(a) {
    color: inherit;
    text-decoration: inherit;
  }

  :global(button) {
    font-family: inherit;
  }

  :global(.material-symbols-outlined) {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 16px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
    vertical-align: middle;
  }

  /* Fix for Safari/iPad date and time input sizing */
  :global(input[type="date"]),
  :global(input[type="time"]) {
    font-size: 0.875rem !important;
    padding: 0.5rem !important;
    line-height: 1rem !important;
    box-sizing: border-box !important;
    -webkit-appearance: none !important;
    appearance: none !important;
  }

  .app-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
  }
</style>
