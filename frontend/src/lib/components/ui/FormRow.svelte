<script lang="ts">
  type Columns = 1 | 2 | 3;

  export let columns: Columns = 2;
  export let ratio: string = ''; // e.g., "2fr 1fr" for unequal widths
</script>

<div
  class="form-row"
  style="--form-columns: {ratio || `repeat(${columns}, 1fr)`}"
>
  <slot />
</div>

<style>
  .form-row {
    display: grid;
    grid-template-columns: var(--form-columns);
    gap: var(--spacing-md);
  }

  /* Mobile: collapse to 1 column */
  @media (max-width: 639px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
