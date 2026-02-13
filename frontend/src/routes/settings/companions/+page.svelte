<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirect to dashboard with companions section open
    // The dashboard handles the actual rendering of settings
    goto('/dashboard?section=companions');
  });
</script>

<div>Redirecting to Companions settings...</div>
