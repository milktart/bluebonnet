<script lang="ts">
  import Dashboard from '../../dashboard/+page.svelte';
  import { dashboardStore } from '$lib/stores/dashboardStore';

  export let data: any;

  // Pass the trip ID we want to expand to the dashboard via props
  let initialTripIdToExpand = data?.trip?.id || null;

</script>

<svelte:component this={Dashboard} tripIdToExpand={initialTripIdToExpand} />
<slot />
