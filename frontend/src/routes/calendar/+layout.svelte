<script lang="ts">
  import Dashboard from '../dashboard/+page.svelte';
</script>

<svelte:component this={Dashboard} shouldOpenCalendar={true} />
<slot />
