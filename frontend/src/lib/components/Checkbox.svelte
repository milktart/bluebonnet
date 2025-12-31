<script lang="ts">
  export let label: string;
  export let checked: boolean = false;
  export let required: boolean = false;
  export let error: string | null = null;
  export let disabled: boolean = false;
</script>

<div class="checkbox-group">
  <div class="checkbox-wrapper">
    <input
      type="checkbox"
      {checked}
      on:change
      {required}
      {disabled}
      id={`checkbox-${label}`}
    />
    <label for={`checkbox-${label}`}>
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  </div>
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    accent-color: #007bff;
  }

  input[type="checkbox"]:disabled {
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
