<script lang="ts">
  type ButtonType = 'button' | 'submit' | 'reset';
  type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  type ButtonSize = 'sm' | 'md' | 'lg';

  export let type: ButtonType = 'button';
  export let variant: ButtonVariant = 'primary';
  export let size: ButtonSize = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
</script>

<button
  {type}
  class="btn btn-{variant} btn-{size}"
  class:fullWidth
  class:loading
  {disabled}
  on:click
>
  {#if loading}
    <span class="spinner" />
  {/if}
  <slot />
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: var(--button-min-height);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
    user-select: none;
    box-sizing: border-box;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button.fullWidth {
    width: 100%;
  }

  button.loading {
    pointer-events: none;
  }

  /* =========================================================================
     SIZE VARIANTS
     ========================================================================= */

  /* Small size */
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: var(--text-xs);
    min-height: 32px;
  }

  /* Medium size (default) */
  .btn-md {
    padding: 0.5rem 1rem;
    font-size: var(--text-sm);
    min-height: 40px;
  }

  /* Large size */
  .btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: var(--text-base);
    min-height: 48px;
  }

  /* =========================================================================
     COLOR VARIANTS
     ========================================================================= */

  /* Primary variant */
  .btn-primary {
    background-color: var(--color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .btn-primary:active:not(:disabled) {
    background-color: var(--color-primary-active);
  }

  /* Secondary variant */
  .btn-secondary {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-bg-secondary);
    border-color: var(--color-border-dark);
  }

  .btn-secondary:active:not(:disabled) {
    background-color: var(--color-bg-tertiary);
  }

  /* Danger variant */
  .btn-danger {
    background-color: var(--color-error);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: var(--color-error-hover);
  }

  .btn-danger:active:not(:disabled) {
    background-color: var(--color-error-active);
  }

  /* Success variant */
  .btn-success {
    background-color: var(--color-success);
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background-color: var(--color-success-hover);
  }

  .btn-success:active:not(:disabled) {
    background-color: var(--color-success-active);
  }

  /* Ghost variant (minimal background, colored text) */
  .btn-ghost {
    background-color: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }

  .btn-ghost:hover:not(:disabled) {
    background-color: var(--color-primary-bg);
  }

  .btn-ghost:active:not(:disabled) {
    background-color: var(--color-primary-light);
  }

  /* =========================================================================
     LOADING SPINNER
     ========================================================================= */

  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* =========================================================================
     RESPONSIVE ADJUSTMENTS
     ========================================================================= */

  /* Mobile (0-639px) - Touch-friendly sizing */
  @media (max-width: 639px) {
    button {
      min-height: var(--button-min-height);
      padding: var(--button-padding-mobile);
      font-size: var(--button-font-size-mobile);
    }
  }

  /* Tablet (640-1023px) - Balanced sizing */
  @media (min-width: 640px) and (max-width: 1023px) {
    button {
      min-height: var(--button-min-height-tablet);
      padding: var(--button-padding-tablet);
    }
  }

  /* Desktop (1024px+) - Compact sizing */
  @media (min-width: 1024px) {
    button {
      min-height: var(--button-min-height-desktop);
      padding: var(--button-padding-desktop);
      font-size: var(--button-font-size-desktop);
    }

    button:active:not(:disabled) {
      transform: none;
    }
  }

  /* Landscape mode */
  @media (max-height: 600px) {
    button {
      min-height: var(--button-min-height-tablet);
      padding: var(--button-padding-tablet);
      font-size: var(--button-font-size-desktop);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) {
    button:active:not(:disabled) {
      opacity: 0.9;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
    }

    button:active:not(:disabled) {
      transform: none;
    }

    .spinner {
      animation: none;
      border-top-color: currentColor;
    }
  }
</style>
