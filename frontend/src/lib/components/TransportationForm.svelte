<script lang="ts">
  import { transportationApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import DateTimePicker from './DateTimePicker.svelte';
  import Select from './Select.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import FormContainer from './FormContainer.svelte';

  export let tripId: string;
  export let transportationId: string | null = null;
  export let transportation: any = null;
  export let onSuccess: ((transportation: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    tripId: tripId,
    type: transportation?.type || 'taxi',
    fromLocation: transportation?.fromLocation || '',
    toLocation: transportation?.toLocation || '',
    departureDate: transportation?.departureDate || '',
    departureTime: transportation?.departureTime || '',
    arrivalDate: transportation?.arrivalDate || '',
    arrivalTime: transportation?.arrivalTime || '',
    provider: transportation?.provider || '',
    confirmationNumber: transportation?.confirmationNumber || '',
    estimatedCost: transportation?.estimatedCost || '',
    notes: transportation?.notes || ''
  };

  const typeOptions = [
    { value: 'taxi', label: 'Taxi/Uber' },
    { value: 'shuttle', label: 'Shuttle/Bus' },
    { value: 'train', label: 'Train' },
    { value: 'subway', label: 'Subway/Metro' },
    { value: 'rental_car', label: 'Rental Car' },
    { value: 'ferry', label: 'Ferry' },
    { value: 'other', label: 'Other' }
  ];

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.fromLocation.trim()) {
        error = 'Departure location is required';
        return;
      }

      if (!formData.toLocation.trim()) {
        error = 'Arrival location is required';
        return;
      }

      if (!formData.departureTime) {
        error = 'Departure time is required';
        return;
      }

      loading = true;
      error = null;

      let savedTransportation;
      if (transportationId) {
        // Update existing transportation
        savedTransportation = await transportationApi.update(transportationId, formData);
        tripStoreActions.updateTransportation(transportationId, savedTransportation);
      } else {
        // Create new transportation - pass tripId and formData
        savedTransportation = await transportationApi.create(tripId, formData);
        tripStoreActions.addTransportation(savedTransportation);
      }

      if (onSuccess) {
        onSuccess(savedTransportation);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save transportation';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }
</script>

<FormContainer
  title={transportationId ? 'Edit Transportation' : 'Add Transportation'}
  submitLabel={transportationId ? 'Update Transportation' : 'Add Transportation'}
  isLoading={loading}
  error={error}
  itemType="transportation"
  itemColor="#06b6d4"
  isEditing={!!transportationId}
  onCancel={handleCancel}
  onDelete={() => {}}
>
  <Select
    label="Transportation Type"
    value={formData.type}
    options={typeOptions}
    on:change={(e) => (formData.type = e.target?.value || 'taxi')}
    required={true}
  />

  <TextInput
    label="From Location"
    value={formData.fromLocation}
    on:change={(e) => (formData.fromLocation = e.target?.value || '')}
    required={true}
    placeholder="Departure address"
  />

  <TextInput
    label="To Location"
    value={formData.toLocation}
    on:change={(e) => (formData.toLocation = e.target?.value || '')}
    required={true}
    placeholder="Arrival address"
  />

  <div class="two-column">
    <div>
      <label class="input-label">Departure Date</label>
      <input
        type="date"
        bind:value={formData.departureDate}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Departure Time</label>
      <input
        type="time"
        bind:value={formData.departureTime}
        class="form-input"
      />
    </div>
  </div>

  <div class="two-column">
    <div>
      <label class="input-label">Arrival Date</label>
      <input
        type="date"
        bind:value={formData.arrivalDate}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Arrival Time</label>
      <input
        type="time"
        bind:value={formData.arrivalTime}
        class="form-input"
      />
    </div>
  </div>

  <TextInput
    label="Provider"
    value={formData.provider}
    on:change={(e) => (formData.provider = e.target?.value || '')}
    placeholder="Transportation provider name"
  />

  <div class="two-column">
    <TextInput
      label="Confirmation Number"
      value={formData.confirmationNumber}
      on:change={(e) => (formData.confirmationNumber = e.target?.value || '')}
      placeholder="Reservation confirmation #"
    />

    <TextInput
      label="Estimated Cost"
      value={formData.estimatedCost}
      on:change={(e) => (formData.estimatedCost = e.target?.value || '')}
      type="number"
      placeholder="0.00"
    />
  </div>

  <Textarea
    label="Notes"
    value={formData.notes}
    on:change={(e) => (formData.notes = e.target?.value || '')}
    placeholder="Additional transportation information..."
    rows={3}
  />

  <div slot="actions" class="form-actions">
    <button type="submit" disabled={loading} class="btn btn-primary">
      {transportationId ? 'Update Transportation' : 'Add Transportation'}
    </button>
    <button type="button" on:click={handleCancel} disabled={loading} class="btn btn-secondary">
      Cancel
    </button>
  </div>
</FormContainer>

<style>
  :global(.two-column) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  :global(.input-label) {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  :global(.form-input) {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  :global(.form-input:focus) {
    outline: none;
    ring: 2px #3b82f6;
    border-color: #3b82f6;
  }

  :global(.form-input:disabled) {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  :global(.btn) {
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    text-align: center;
  }

  :global(.btn-primary) {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  :global(.btn-primary:hover:not(:disabled)) {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  :global(.btn-secondary) {
    background-color: white;
    color: #374151;
    border-color: #d1d5db;
  }

  :global(.btn-secondary:hover:not(:disabled)) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  @media (max-width: 600px) {
    :global(.two-column) {
      grid-template-columns: 1fr;
    }
  }
</style>
