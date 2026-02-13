<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirect to dashboard with vouchers section open
    // The dashboard handles the actual rendering of settings
    goto('/dashboard?section=vouchers');
  });
</script>

<div>Redirecting to Vouchers settings...</div>
