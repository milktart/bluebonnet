<script lang="ts">
  import { tripsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import DateTimePicker from './DateTimePicker.svelte';
  import Select from './Select.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import FormContainer from './FormContainer.svelte';

  export let tripId: string | null = null;
  export let trip: any = null;
  export let onSuccess: ((trip: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    name: trip?.name || '',
    destination: trip?.destination || '',
    description: trip?.description || '',
    departureDate: trip?.departureDate || trip?.startDate || '',
    returnDate: trip?.returnDate || trip?.endDate || '',
    budget: trip?.budget || '',
    status: trip?.status || 'planning'
  };

  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.name.trim()) {
        error = 'Trip name is required';
        return;
      }

      if (!formData.destination.trim()) {
        error = 'Destination is required';
        return;
      }

      loading = true;
      error = null;

      let savedTrip;
      if (tripId) {
        // Update existing trip
        savedTrip = await tripsApi.update(tripId, formData);
        tripStoreActions.updateTrip(tripId, savedTrip);
      } else {
        // Create new trip
        savedTrip = await tripsApi.create(formData);
        tripStoreActions.addTrip(savedTrip);
      }

      if (onSuccess) {
        onSuccess(savedTrip);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save trip';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }

  function handleNameChange(e: Event) {
    formData.name = (e.target as HTMLInputElement).value;
  }

  function handleDestinationChange(e: Event) {
    formData.destination = (e.target as HTMLInputElement).value;
  }

  function handleDescriptionChange(e: Event) {
    formData.description = (e.target as HTMLTextAreaElement).value;
  }

  function handleBudgetChange(e: Event) {
    formData.budget = (e.target as HTMLInputElement).value;
  }

  function handleStatusChange(e: Event) {
    formData.status = (e.target as HTMLSelectElement).value;
  }
</script>

<FormContainer
  title={tripId ? 'Edit Trip' : 'Create New Trip'}
  submitLabel={tripId ? 'Update Trip' : 'Create Trip'}
  isLoading={loading}
  error={error}
>
  <TextInput
    label="Trip Name"
    value={formData.name}
    on:change={handleNameChange}
    required={true}
    placeholder="e.g., Summer Europe Adventure"
  />

  <TextInput
    label="Destination"
    value={formData.destination}
    on:change={handleDestinationChange}
    required={true}
    placeholder="e.g., Paris, France"
  />

  <Textarea
    label="Description"
    value={formData.description}
    on:change={handleDescriptionChange}
    placeholder="Trip details and notes..."
    rows={4}
  />

  <div class="two-column">
    <DateTimePicker
      label="Departure Date"
      value={formData.departureDate}
      on:change={(e) => (formData.departureDate = e.target?.value || '')}
    />

    <DateTimePicker
      label="Return Date"
      value={formData.returnDate}
      on:change={(e) => (formData.returnDate = e.target?.value || '')}
    />
  </div>

  <div class="two-column">
    <TextInput
      label="Budget"
      value={formData.budget}
      on:change={handleBudgetChange}
      type="number"
      placeholder="0.00"
    />

    <Select
      label="Status"
      value={formData.status}
      options={statusOptions}
      on:change={handleStatusChange}
    />
  </div>

  <div slot="actions" class="form-actions">
    <Button variant="primary" type="submit" on:click={handleSubmit} disabled={loading}>
      {#if loading}
        <span class="loading-spinner"></span>
        Saving...
      {:else}
        {tripId ? 'Update Trip' : 'Create Trip'}
      {/if}
    </Button>
    <Button variant="secondary" type="button" on:click={handleCancel} disabled={loading}>
      Cancel
    </Button>
  </div>
</FormContainer>

<style>
  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  @media (max-width: 600px) {
    .two-column {
      grid-template-columns: 1fr;
    }
  }

  .loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
