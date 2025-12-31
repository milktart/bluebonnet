# 📝 Form Components

Reusable form components for Phase 1 Svelte implementation.

---

## Overview

All travel item forms follow same structure: input fields → validation → submission → store update.

---

## Base Form Component

### FormContainer.svelte
Wrapper for all item forms with consistent styling/layout.

```svelte
<script lang="ts">
  export let title: string;
  export let isEditMode: boolean = false;
  export let onSubmit: (data: any) => Promise<void>;
  export let onCancel: () => void;

  let isSubmitting = false;
  let error: string | null = null;

  async function handleSubmit(e: SubmitEvent) {
    isSubmitting = true;
    error = null;

    try {
      await onSubmit((e.target as HTMLFormElement));
    } catch (err) {
      error = (err as Error).message;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <h2>{title}</h2>

  <slot />

  <div class="form-actions">
    <button type="submit" disabled={isSubmitting}>
      {isEditMode ? 'Update' : 'Add'}
    </button>
    <button type="button" on:click={onCancel}>Cancel</button>
  </div>

  {#if error}
    <div class="form-error">{error}</div>
  {/if}
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
```

---

## Input Components

### TextInput.svelte
```svelte
<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let type: string = 'text';
  export let required: boolean = false;
  export let error: string | null = null;
  export let placeholder: string = '';

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
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
  }

  .required {
    color: #dc3545;
  }
</style>
```

### DateTimePicker.svelte
```svelte
<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let required: boolean = false;
  export let error: string | null = null;
  export let minDate: string | null = null;

  let dateValue: string = '';
  let timeValue: string = '';

  $: {
    // Split ISO datetime into date and time
    if (value) {
      const date = new Date(value);
      dateValue = date.toISOString().split('T')[0];
      timeValue = date.toISOString().split('T')[1].substring(0, 5);
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
      value = new Date(`${dateValue}T${timeValue}`).toISOString();
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
    <input
      type="date"
      value={dateValue}
      on:change={handleDateChange}
      {required}
      {minDate}
    />
    <input
      type="time"
      value={timeValue}
      on:change={handleTimeChange}
      {required}
    />
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

  .inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>
```

### Select.svelte
```svelte
<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let options: Array<{ value: string; label: string }> = [];
  export let required: boolean = false;
  export let error: string | null = null;
</script>

<div class="select-group">
  <label>
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  <select {value} on:change {required}>
    <option value="">-- Select --</option>
    {#each options as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    appearance: none;
  }
</style>
```

---

## Flight Form Components

### FlightForm.svelte
Complete flight add/edit form using components above.

```svelte
<script lang="ts">
  import { tripStore } from '$lib/stores/tripStore';
  import { apiClient } from '$lib/services/apiClient';
  import FormContainer from './FormContainer.svelte';
  import TextInput from './TextInput.svelte';
  import DateTimePicker from './DateTimePicker.svelte';
  import Select from './Select.svelte';
  import AirportAutocomplete from './AirportAutocomplete.svelte';

  export let tripId: string;
  export let flight: any | null = null;
  export let onCancel: () => void;

  let isEditMode = !!flight;
  let formData = flight || {
    airline: '',
    flightNumber: '',
    origin: '',
    destination: '',
    departureDateTime: '',
    arrivalDateTime: '',
    notes: ''
  };

  let errors = {};

  function validateForm() {
    errors = {};
    if (!formData.airline?.trim()) errors.airline = 'Required';
    if (!formData.flightNumber?.trim()) errors.flightNumber = 'Required';
    if (!formData.origin?.trim()) errors.origin = 'Required';
    if (!formData.destination?.trim()) errors.destination = 'Required';
    if (!formData.departureDateTime) errors.departureDateTime = 'Required';
    if (!formData.arrivalDateTime) errors.arrivalDateTime = 'Required';

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    const url = isEditMode
      ? `/api/flights/${flight.id}`
      : `/api/trips/${tripId}/flights`;

    const method = isEditMode ? 'PUT' : 'POST';

    const response = await apiClient.request(url, { method, body: formData });

    if (response.success) {
      $tripStore.flights = isEditMode
        ? $tripStore.flights.map(f => f.id === response.flight.id ? response.flight : f)
        : [...$tripStore.flights, response.flight];
      onCancel();
    }
  }
</script>

<FormContainer
  title={isEditMode ? 'Edit Flight' : 'Add Flight'}
  {isEditMode}
  {onSubmit=handleSubmit}
  {onCancel}
>
  <AirportAutocomplete
    label="From"
    bind:value={formData.origin}
    error={errors.origin}
    required
  />

  <AirportAutocomplete
    label="To"
    bind:value={formData.destination}
    error={errors.destination}
    required
  />

  <TextInput
    label="Airline"
    bind:value={formData.airline}
    error={errors.airline}
    required
  />

  <TextInput
    label="Flight Number"
    bind:value={formData.flightNumber}
    error={errors.flightNumber}
    required
  />

  <DateTimePicker
    label="Departure"
    bind:value={formData.departureDateTime}
    error={errors.departureDateTime}
    required
  />

  <DateTimePicker
    label="Arrival"
    bind:value={formData.arrivalDateTime}
    error={errors.arrivalDateTime}
    required
  />

  <TextInput
    label="Notes"
    bind:value={formData.notes}
    type="textarea"
  />
</FormContainer>
```

---

## Display Components

### FlightCard.svelte
```svelte
<script lang="ts">
  export let flight: any;
  export let onEdit: () => void;
  export let onDelete: () => void;

  function getFlightDuration() {
    const dept = new Date(flight.departureDateTime);
    const arr = new Date(flight.arrivalDateTime);
    const hours = Math.floor((arr - dept) / (1000 * 60 * 60));
    const mins = Math.floor(((arr - dept) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  }
</script>

<div class="flight-card">
  <div class="header">
    <h3>{flight.airline} {flight.flightNumber}</h3>
    <div class="actions">
      <button on:click={onEdit}>Edit</button>
      <button on:click={onDelete} class="danger">Delete</button>
    </div>
  </div>

  <div class="details">
    <div class="route">
      <span class="airport">{flight.origin}</span>
      <span class="arrow">→</span>
      <span class="airport">{flight.destination}</span>
    </div>
    <p class="duration">{getFlightDuration()}</p>
  </div>

  <div class="times">
    <div>
      Depart: {new Date(flight.departureDateTime).toLocaleString()}
    </div>
    <div>
      Arrive: {new Date(flight.arrivalDateTime).toLocaleString()}
    </div>
  </div>

  {#if flight.notes}
    <p class="notes">{flight.notes}</p>
  {/if}
</div>

<style>
  .flight-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    background: white;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .route {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .arrow {
    color: #666;
  }

  .duration {
    color: #666;
    font-size: 0.875rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
  }

  button.danger {
    background: #dc3545;
  }
</style>
```

---

## Component Checklist

When creating new form component:
- [ ] Props exported with TypeScript types
- [ ] Error handling and display
- [ ] Validation integration
- [ ] Loading/disabled states
- [ ] Accessible labels
- [ ] Responsive layout
- [ ] Consistent styling with Tailwind
- [ ] Test coverage (unit + integration)

---

## Related Documentation

- **[Component Library Overview](./README.md)** - Component structure
- **[Form Handling Pattern](../PATTERNS/FORM_HANDLING.md)** - Form submission
- **[Svelte Basics](../LEARNING_RESOURCES/SVELTEKIT_BASICS.md)** - Svelte reference

---

**Last Updated:** 2025-12-17
**Status:** Component specs for Phase 1 implementation
