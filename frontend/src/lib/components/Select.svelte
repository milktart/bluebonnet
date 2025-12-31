<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let options: Array<{ value: string; label: string }> = [];
  export let required: boolean = false;
  export let error: string | null = null;
  export let placeholder: string = 'Select...';
</script>

<div class="select-group">
  <label>
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  <select {value} on:change {required}>
    <option value="">{placeholder}</option>
    {#each options as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .select-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    background: white;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>');
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1.5em;
    padding-right: 2.5rem;
  }

  select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  .required {
    color: #dc3545;
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
  }
</style>
