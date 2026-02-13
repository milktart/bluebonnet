<script lang="ts">
  type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type Align = 'start' | 'center' | 'end' | 'stretch';

  export let gap: Gap = 'md';
  export let align: Align = 'start';
</script>

<div class="stack" style="--stack-gap: var(--spacing-{gap}); --stack-align: {align}">
  <slot />
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--stack-gap);
    align-items: var(--stack-align);
  }
</style>
