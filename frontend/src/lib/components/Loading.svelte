<script lang="ts">
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let message: string = 'Loading...';
</script>

<div class="loading-container loading-{size}">
  <div class="spinner"></div>
  {#if message}
    <p class="loading-message">{message}</p>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .loading-small {
    padding: 0.5rem;
  }

  .loading-medium {
    padding: 1.5rem;
  }

  .loading-large {
    padding: 3rem;
  }

  .spinner {
    border: 3px solid var(--color-bg-tertiary);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-small .spinner {
    width: 24px;
    height: 24px;
  }

  .loading-medium .spinner {
    width: 40px;
    height: 40px;
  }

  .loading-large .spinner {
    width: 60px;
    height: 60px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-message {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--text-md);
  }
</style>
