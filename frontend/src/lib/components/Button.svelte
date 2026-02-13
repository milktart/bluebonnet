<!-- @deprecated Use ui/Button.svelte instead: import { Button } from '$lib/components/ui' -->
<script lang="ts">
  type ButtonType = 'button' | 'submit' | 'reset';
  type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

  export let type: ButtonType = 'button';
  export let variant: ButtonVariant = 'primary';
  export let disabled: boolean = false;
  export let loading: boolean = false;
</script>

<button
  {type}
  class="btn btn-{variant}"
  {disabled}
  on:click
>
  {#if loading}
    <span class="spinner"></span>
  {/if}
  <slot />
</button>

<style>
  button {
    padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.25rem);
    border: none;
    border-radius: 0.375rem;
    font-size: clamp(0.75rem, 2vw, 0.875rem);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.25rem, 1vw, 0.5rem);
    min-height: 44px;
    white-space: nowrap;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  /* Primary variant */
  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-primary:active:not(:disabled) {
    background-color: #1d4ed8;
  }

  /* Secondary variant */
  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .btn-secondary:active:not(:disabled) {
    background-color: #f3f4f6;
  }

  /* Danger variant */
  .btn-danger {
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .btn-danger:active:not(:disabled) {
    background-color: #b91c1c;
  }

  /* Success variant */
  .btn-success {
    background-color: #10b981;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background-color: #059669;
  }

  .btn-success:active:not(:disabled) {
    background-color: #047857;
  }

  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* Mobile (0-479px) - Slightly larger */
  @media (max-width: 479px) {
    button {
      min-height: 44px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
    }
  }

  /* Tablet (640-1023px) - Balanced */
  @media (min-width: 640px) and (max-width: 1023px) {
    button {
      min-height: 40px;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }
  }

  /* Desktop (1024px+) - Compact */
  @media (min-width: 1024px) {
    button {
      min-height: 36px;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    button:active:not(:disabled) {
      transform: none;
    }
  }

  /* Landscape mode (short viewport) */
  @media (max-height: 600px) {
    button {
      min-height: 40px;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
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
      border-top-color: rgba(255, 255, 255, 0.3);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
