<script lang="ts">
  import Dashboard from '../../../../dashboard/+page.svelte';
  import { onMount } from 'svelte';
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';

  export let data: any;

  onMount(() => {
    if (data?.trip && data?.item) {
      // Expand the trip so it shows in primary sidebar
      dashboardStoreActions.toggleTripExpanded(data.trip.id);

      // Determine the item type from the item data
      let itemType = 'flight'; // default
      if (data.item.checkIn) itemType = 'hotel';
      else if (data.item.departureDate && data.item.departureAirport) itemType = 'flight';
      else if (data.item.pickupDate) itemType = 'carRental';
      else if (data.item.departureTime && !data.item.flightNumber) itemType = 'transportation';
      else if (data.item.eventDate) itemType = 'event';

      // Open the item edit form in secondary sidebar
      dashboardStoreActions.openSecondarySidebar({
        type: itemType,
        itemType: itemType,
        data: data.item
      });
    }
  });
</script>

<svelte:component this={Dashboard} />
<slot />
