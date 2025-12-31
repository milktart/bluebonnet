<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let type: string = 'text';
  export let required: boolean = false;
  export let error: string | null = null;
  export let placeholder: string = '';
  export let maxlength: number | undefined = undefined;
  export let minlength: number | undefined = undefined;
  export let disabled: boolean = false;
  export let autocomplete: string | undefined = undefined;

  function handleChange(e: Event) {
    value = (e.target as HTMLInputElement).value;
  }
</script>

<div class="input-group">
  <label>
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  <input
    {type}
    {value}
    {placeholder}
    {required}
    {disabled}
    {maxlength}
    {minlength}
    {autocomplete}
    on:change={handleChange}
    on:input={handleChange}
  />
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  input:disabled {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .required {
    color: #dc3545;
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
  }
</style>
