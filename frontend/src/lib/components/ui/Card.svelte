<script lang="ts">
  type PaddingSize = 'sm' | 'md' | 'lg';
  type ShadowSize = 'sm' | 'md' | 'lg' | 'none';

  export let padding: PaddingSize = 'md';
  export let shadow: ShadowSize = 'sm';
  export let interactive: boolean = false;
</script>

<div class="card" class:interactive class:card-{padding} class:shadow-{shadow}>
  <slot />
</div>

<style>
  .card {
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    transition: all 0.15s ease-in-out;
  }

  /* =========================================================================
     PADDING VARIANTS
     ========================================================================= */

  .card-sm {
    padding: var(--spacing-sm);
  }

  .card-md {
    padding: var(--spacing-md);
  }

  .card-lg {
    padding: var(--spacing-lg);
  }

  /* =========================================================================
     SHADOW VARIANTS
     ========================================================================= */

  .shadow-sm {
    box-shadow: var(--shadow-sm);
  }

  .shadow-md {
    box-shadow: var(--shadow-md);
  }

  .shadow-lg {
    box-shadow: var(--shadow-lg);
  }

  .shadow-none {
    box-shadow: none;
  }

  /* =========================================================================
     INTERACTIVE VARIANT
     ========================================================================= */

  .card.interactive {
    cursor: pointer;
  }

  .card.interactive:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
  }

  .card.interactive:active {
    transform: scale(0.98);
  }
</style>
