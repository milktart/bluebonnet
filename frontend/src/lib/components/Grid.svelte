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
    /* Mobile-first: 1 column by default (0-479px) */
    grid-template-columns: 1fr;
  }

  /* Small mobile: still 1 column (480-639px) */
  @media (min-width: 480px) {
    .grid.responsive {
      grid-template-columns: 1fr;
    }
  }

  /* Tablet: 2 columns (640-1023px) */
  @media (min-width: 640px) {
    .grid.responsive {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Desktop: use specified columns (1024px+) */
  @media (min-width: 1024px) {
    .grid.responsive {
      grid-template-columns: repeat(var(--grid-columns), 1fr);
    }
  }

  /* Landscape mode: adjust for short viewport */
  @media (max-height: 600px) and (max-width: 639px) {
    .grid.responsive {
      gap: clamp(0.5rem, 2vw, 0.75rem);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .grid {
      scroll-behavior: auto;
    }
  }
</style>
