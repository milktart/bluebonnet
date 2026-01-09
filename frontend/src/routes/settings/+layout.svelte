<script lang="ts">
  import Dashboard from '../dashboard/+page.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';

  const sectionMap: Record<string, string> = {
    'account': 'settings-profile',
    'security': 'settings-security',
    'backup': 'settings-backup',
    'vouchers': 'settings-vouchers',
    'companions': 'settings-companions',
    'users': 'settings-users',
    'airports': 'settings-airports'
  };

  onMount(() => {
    const pathSegments = $page.url.pathname.split('/');
    const section = pathSegments[pathSegments.length - 1];
    const sectionType = sectionMap[section] || 'settings-profile';

    dashboardStoreActions.setActiveView('settings');
    dashboardStoreActions.openSecondarySidebar({ type: sectionType, data: {} });
  });
</script>

<svelte:component this={Dashboard} />
<slot />
