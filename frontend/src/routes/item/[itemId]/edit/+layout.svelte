<script lang="ts">
  import Dashboard from '../../../dashboard/+page.svelte';
  import { onMount } from 'svelte';
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';

  export let data: any;

  onMount(() => {
    if (data?.item && data?.itemType) {
      // Open the item edit form in secondary sidebar
      dashboardStoreActions.openSecondarySidebar({
        type: data.itemType,
        itemType: data.itemType,
        data: data.item
      });
    }
  });
</script>

<svelte:component this={Dashboard} />
<slot />
