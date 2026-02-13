<script lang="ts">
  type Columns = 1 | 2 | 3 | 4;
  type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  export let columns: Columns = 2;
  export let gap: Gap = 'md';
  export let collapse: boolean = true; // Auto-collapse to 1 col on mobile when true
</script>

<div
  class="grid-layout"
  class:collapse-mobile={collapse}
  style="--grid-columns: {columns}; --grid-gap: var(--spacing-{gap})"
>
  <slot />
</div>

<style>
  .grid-layout {
    display: grid;
    grid-template-columns: repeat(var(--grid-columns), 1fr);
    gap: var(--grid-gap);
  }

  /* Mobile: collapse to 1 column if collapse=true */
  @media (max-width: 639px) {
    .grid-layout.collapse-mobile {
      grid-template-columns: 1fr;
    }
  }
</style>
