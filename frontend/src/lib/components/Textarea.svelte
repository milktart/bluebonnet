<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let required: boolean = false;
  export let error: string | null = null;
  export let placeholder: string = '';
  export let rows: number = 4;
</script>

<div class="textarea-group">
  <label>
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  <textarea
    {value}
    on:change
    {required}
    {placeholder}
    {rows}
  ></textarea>
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .textarea-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  textarea {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  }

  textarea:focus {
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
