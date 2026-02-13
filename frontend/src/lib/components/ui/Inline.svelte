<script lang="ts">
  type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type Align = 'start' | 'center' | 'end' | 'stretch';
  type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

  export let gap: Gap = 'md';
  export let align: Align = 'center';
  export let justify: Justify = 'start';
  export let wrap: boolean = false;

  const justifyMap: Record<Justify, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around'
  };
</script>

<div
  class="inline"
  style="--inline-gap: var(--spacing-{gap}); --inline-align: {align}; --inline-justify: {justifyMap[justify]}; --inline-wrap: {wrap ? 'wrap' : 'nowrap'}"
>
  <slot />
</div>

<style>
  .inline {
    display: flex;
    flex-direction: row;
    gap: var(--inline-gap);
    align-items: var(--inline-align);
    justify-content: var(--inline-justify);
    flex-wrap: var(--inline-wrap);
  }
</style>
