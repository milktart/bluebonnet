<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirect to dashboard with trusted-companions section open
    // The dashboard handles the actual rendering of settings
    goto('/dashboard?section=trusted-companions');
  });
</script>

<div>Redirecting to Trusted Companions settings...</div>
