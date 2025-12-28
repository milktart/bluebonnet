<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let required: boolean = false;
  export let error: string | null = null;
  export let minDate: string | null = null;

  let dateValue: string = '';
  let timeValue: string = '';

  // Parse ISO string into date and time components
  $: {
    if (value) {
      try {
        const date = new Date(value);
        dateValue = date.toISOString().split('T')[0];
        timeValue = date.toISOString().split('T')[1]?.substring(0, 5) || '';
      } catch (e) {
        // Invalid date, ignore
      }
    }
  }

  function handleDateChange(e: Event) {
    dateValue = (e.target as HTMLInputElement).value;
    updateValue();
  }

  function handleTimeChange(e: Event) {
    timeValue = (e.target as HTMLInputElement).value;
    updateValue();
  }

  function updateValue() {
    if (dateValue && timeValue) {
      try {
        // Create ISO string from date and time
        value = `${dateValue}T${timeValue}:00.000Z`;
      } catch (e) {
        // Invalid input, ignore
      }
    }
  }
</script>

<div class="datetime-group">
  <label>
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>

  <div class="inputs">
    <div class="input-wrapper">
      <input
        type="date"
        value={dateValue}
        on:change={handleDateChange}
        {required}
        {minDate}
      />
    </div>
    <div class="input-wrapper">
      <input
        type="time"
        value={timeValue}
        on:change={handleTimeChange}
        {required}
      />
    </div>
  </div>

  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .datetime-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .inputs {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0.5rem;
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    box-sizing: border-box;
  }

  input:focus {
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
