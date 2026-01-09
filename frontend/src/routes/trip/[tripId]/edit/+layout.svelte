<script lang="ts">
  import Dashboard from '../../../dashboard/+page.svelte';
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';

  export let data: any;

  let initialTripIdToExpand = data?.trip?.id || null;
  let initialTripData = data?.trip || null;

  // Pre-open the edit form with the trip data
  if (initialTripData) {
    dashboardStoreActions.openSecondarySidebar({ type: 'trip', itemType: 'trip', data: initialTripData });
  }
</script>

<svelte:component this={Dashboard} tripIdToExpand={initialTripIdToExpand} />
<slot />
