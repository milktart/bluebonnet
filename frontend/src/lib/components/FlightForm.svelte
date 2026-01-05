<script lang="ts">
  import { flightsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import DateTimePicker from './DateTimePicker.svelte';
  import Select from './Select.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import FormContainer from './FormContainer.svelte';

  export let tripId: string;
  export let flightId: string | null = null;
  export let flight: any = null;
  export let onSuccess: ((flight: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    tripId: tripId,
    airline: flight?.airline || '',
    flightNumber: flight?.flightNumber || '',
    origin: flight?.origin || '',
    destination: flight?.destination || '',
    departureDate: flight?.departureDate || '',
    departureTime: flight?.departureTime || '',
    arrivalDate: flight?.arrivalDate || '',
    arrivalTime: flight?.arrivalTime || '',
    seatNumber: flight?.seatNumber || '',
    seatClass: flight?.seatClass || 'economy',
    boardingGroup: flight?.boardingGroup || '',
    notes: flight?.notes || ''
  };

  const seatClassOptions = [
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' }
  ];

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.origin.trim()) {
        error = 'Origin airport is required';
        return;
      }

      if (!formData.destination.trim()) {
        error = 'Destination airport is required';
        return;
      }

      if (!formData.departureDate) {
        error = 'Departure date is required';
        return;
      }

      loading = true;
      error = null;

      let savedFlight;
      if (flightId) {
        // Update existing flight
        savedFlight = await flightsApi.update(flightId, formData);
        tripStoreActions.updateFlight(flightId, savedFlight);
        // Invalidate cache after update
        dataService.invalidateCache('trip');
      } else {
        // Create new flight - pass tripId and formData
        savedFlight = await flightsApi.create(tripId, formData);
        tripStoreActions.addFlight(savedFlight);
        // Invalidate cache after create
        dataService.invalidateCache('all');
      }

      if (onSuccess) {
        onSuccess(savedFlight);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save flight';
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
  title={flightId ? 'Edit Flight' : 'Add Flight'}
  submitLabel={flightId ? 'Update Flight' : 'Add Flight'}
  isLoading={loading}
  error={error}
  itemType="flight"
  itemColor="#3b82f6"
  isEditing={!!flightId}
  onCancel={handleCancel}
  onDelete={() => {}}
>
  <div class="three-column">
    <TextInput
      label="Flight Number"
      value={formData.flightNumber}
      on:change={(e) => (formData.flightNumber = e.target?.value || '')}
      required={true}
      placeholder="KL668"
    />

    <div class="col-span-2">
      <TextInput
        label="Airline"
        value={formData.airline}
        on:change={(e) => (formData.airline = e.target?.value || '')}
        placeholder="e.g., KLM"
        disabled={true}
      />
    </div>
  </div>

  <div class="two-column">
    <TextInput
      label="Origin"
      value={formData.origin}
      on:change={(e) => (formData.origin = e.target?.value || '')}
      required={true}
      placeholder="AUS"
    />

    <TextInput
      label="Destination"
      value={formData.destination}
      on:change={(e) => (formData.destination = e.target?.value || '')}
      required={true}
      placeholder="AMS"
    />
  </div>

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
        placeholder="HH:MM"
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
        placeholder="HH:MM"
        class="form-input"
      />
    </div>
  </div>

  <div class="three-column">
    <div class="col-span-2">
      <TextInput
        label="PNR"
        value={formData.pnr}
        on:change={(e) => (formData.pnr = e.target?.value || '')}
        placeholder="ABC123D"
      />
    </div>

    <TextInput
      label="Seat"
      value={formData.seatNumber}
      on:change={(e) => (formData.seatNumber = e.target?.value || '')}
      placeholder="4A"
    />
  </div>

  <div slot="actions" class="form-actions">
    <button type="submit" disabled={loading} class="btn btn-primary">
      {flightId ? 'Update Flight' : 'Add Flight'}
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

  :global(.three-column) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  :global(.col-span-2) {
    grid-column: span 2;
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
    :global(.two-column),
    :global(.three-column) {
      grid-template-columns: 1fr;
    }

    :global(.col-span-2) {
      grid-column: span 1;
    }
  }
</style>
