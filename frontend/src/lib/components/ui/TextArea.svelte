<script lang="ts">
  export let value: string = '';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let required: boolean = false;
  export let rows: number = 3;
  export let id: string = '';
</script>

<textarea
  {id}
  bind:value
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {rows}
  on:input
  on:change
  on:focus
  on:blur
></textarea>

<style>
  textarea {
    width: 100%;
    padding: var(--form-input-padding-mobile);
    min-height: calc(var(--form-input-min-height) * 2);
    font-size: var(--form-input-font-size-mobile);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    font-family: inherit;
    resize: vertical;
    transition: all 0.15s ease-in-out;
    box-sizing: border-box;
  }

  textarea::placeholder {
    color: var(--color-text-tertiary);
  }

  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  textarea:disabled {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: not-allowed;
    opacity: 0.6;
  }

  textarea:readonly {
    background-color: var(--color-bg-secondary);
    cursor: default;
  }

  /* Tablet: balanced sizing */
  @media (min-width: 640px) and (max-width: 1023px) {
    textarea {
      padding: var(--form-input-padding-tablet);
      font-size: var(--form-input-font-size-tablet);
    }
  }

  /* Desktop: compact sizing */
  @media (min-width: 1024px) {
    textarea {
      padding: var(--form-input-padding-desktop);
      font-size: var(--form-input-font-size-desktop);
    }
  }
</style>
