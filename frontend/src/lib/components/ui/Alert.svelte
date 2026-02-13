<script lang="ts">
  type AlertVariant = 'success' | 'error' | 'warning' | 'info';

  export let variant: AlertVariant = 'info';
  export let dismissible: boolean = false;
  export let title: string = '';

  let visible = true;

  function dismiss() {
    visible = false;
  }
</script>

{#if visible}
  <div class="alert alert-{variant}">
    <div class="alert-content">
      {#if title}
        <div class="alert-title">{title}</div>
      {/if}
      <div class="alert-message">
        <slot />
      </div>
    </div>
    {#if dismissible}
      <button class="alert-close" on:click={dismiss} aria-label="Dismiss alert">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4L4 12M4 4l8 8" />
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .alert-content {
    flex: 1;
  }

  .alert-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .alert-message {
    color: inherit;
  }

  .alert-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.15s;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  .alert-close:hover {
    opacity: 1;
  }

  /* =========================================================================
     VARIANT COLORS
     ========================================================================= */

  .alert-success {
    background-color: var(--color-success-bg);
    color: var(--color-success-text);
    border-left: 4px solid var(--color-success);
  }

  .alert-error {
    background-color: var(--color-error-bg);
    color: var(--color-error-text);
    border-left: 4px solid var(--color-error);
  }

  .alert-warning {
    background-color: var(--color-warning-bg);
    color: var(--color-warning-text);
    border-left: 4px solid var(--color-warning);
  }

  .alert-info {
    background-color: var(--color-info-bg);
    color: var(--color-info-text);
    border-left: 4px solid var(--color-info);
  }
</style>
