<script lang="ts">
  export let label: string;
  export let value: string;
  export let groupValue: string = '';
  export let name: string;
  export let required: boolean = false;
  export let error: string | null = null;
  export let disabled: boolean = false;
</script>

<div class="radio-wrapper">
  <input
    type="radio"
    {value}
    checked={groupValue === value}
    on:change
    {required}
    {disabled}
    {name}
    id={`radio-${name}-${value}`}
  />
  <label htmlFor={`radio-${name}-${value}`}>
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .radio-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    accent-color: #007bff;
  }

  input[type="radio"]:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.95rem;
    cursor: pointer;
  }

  .required {
    color: #dc3545;
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
  }
</style>
