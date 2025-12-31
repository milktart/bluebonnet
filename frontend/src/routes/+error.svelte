<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/Button.svelte';
  import Card from '$lib/components/Card.svelte';
</script>

<svelte:head>
  <title>Error - Bluebonnet</title>
</svelte:head>

<div class="error-container">
  <Card title="Oops! Something went wrong" subtitle="Error {$page.status}">
    <div class="error-content">
      <p class="error-message">
        {#if $page.status === 404}
          The page you're looking for doesn't exist.
        {:else if $page.status === 500}
          We encountered an internal server error. Please try again later.
        {:else}
          An unexpected error occurred. Please try again.
        {/if}
      </p>

      <div class="error-actions">
        <Button variant="primary" on:click={() => (window.location.href = '/')}>
          Go to Home
        </Button>
        <Button variant="secondary" on:click={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  </Card>
</div>

<style>
  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem 1rem;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
    max-width: 500px;
  }

  .error-message {
    margin: 0;
    font-size: 1.1rem;
    color: #666;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
</style>
