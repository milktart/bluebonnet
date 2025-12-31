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
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Primary variant */
  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
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

  /* Danger variant */
  .btn-danger {
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  /* Success variant */
  .btn-success {
    background-color: #10b981;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background-color: #059669;
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

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
