<script lang="ts">
  type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'datetime-local' | 'tel' | 'url';

  export let type: InputType = 'text';
  export let value: string | number = '';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let required: boolean = false;
  export let min: string | number = '';
  export let max: string | number = '';
  export let step: string | number = '';
  export let id: string = '';
</script>

<input
  {type}
  {id}
  bind:value
  {placeholder}
  {disabled}
  {readonly}
  {required}
  min={min || undefined}
  max={max || undefined}
  step={step || undefined}
  on:input
  on:change
  on:focus
  on:blur
/>

<style>
  input {
    width: 100%;
    padding: var(--form-input-padding-mobile);
    min-height: var(--form-input-min-height);
    font-size: var(--form-input-font-size-mobile);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    transition: all 0.15s ease-in-out;
    box-sizing: border-box;
  }

  input::placeholder {
    color: var(--color-text-tertiary);
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  input:disabled {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    cursor: not-allowed;
    opacity: 0.6;
  }

  input:readonly {
    background-color: var(--color-bg-secondary);
    cursor: default;
  }

  /* Tablet: balanced sizing */
  @media (min-width: 640px) and (max-width: 1023px) {
    input {
      padding: var(--form-input-padding-tablet);
      min-height: var(--form-input-min-height-tablet);
      font-size: var(--form-input-font-size-tablet);
    }
  }

  /* Desktop: compact sizing */
  @media (min-width: 1024px) {
    input {
      padding: var(--form-input-padding-desktop);
      min-height: var(--form-input-min-height-desktop);
      font-size: var(--form-input-font-size-desktop);
    }
  }
</style>