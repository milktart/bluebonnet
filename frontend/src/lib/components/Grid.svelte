<script lang="ts">
  export let columns: number = 2;
  export let gap: string = '1rem';
  export let responsive: boolean = true;
</script>

<div
  class="grid"
  class:responsive
  style="
    --grid-columns: {columns};
    --grid-gap: {gap};
  "
>
  <slot />
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--grid-columns), 1fr);
    gap: var(--grid-gap);
  }

  .grid.responsive {
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    @media (min-width: 769px) and (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
