<script lang="ts">
  import { carRentalsApi } from '$lib/services/api';
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
  export let carRentalId: string | null = null;
  export let carRental: any = null;
  export let onSuccess: ((carRental: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    tripId: tripId,
    company: carRental?.company || '',
    vehicle: carRental?.vehicle || '',
    pickupLocation: carRental?.pickupLocation || '',
    dropoffLocation: carRental?.dropoffLocation || '',
    pickupDate: carRental?.pickupDate || '',
    pickupTime: carRental?.pickupTime || '',
    dropoffDate: carRental?.dropoffDate || '',
    dropoffTime: carRental?.dropoffTime || '',
    confirmationNumber: carRental?.confirmationNumber || '',
    estimatedCost: carRental?.estimatedCost || '',
    insuranceType: carRental?.insuranceType || 'none',
    notes: carRental?.notes || ''
  };

  const insuranceOptions = [
    { value: 'none', label: 'No Additional Insurance' },
    { value: 'basic', label: 'Basic Coverage' },
    { value: 'full', label: 'Full Coverage' },
    { value: 'premium', label: 'Premium Coverage' }
  ];

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.company.trim()) {
        error = 'Rental company is required';
        return;
      }

      if (!formData.pickupDate) {
        error = 'Pickup date is required';
        return;
      }

      if (!formData.dropoffDate) {
        error = 'Dropoff date is required';
        return;
      }

      loading = true;
      error = null;

      let savedCarRental;
      if (carRentalId) {
        // Update existing car rental
        savedCarRental = await carRentalsApi.update(carRentalId, formData);
        tripStoreActions.updateCarRental(carRentalId, savedCarRental);
        // Invalidate cache after update
        dataService.invalidateCache('trip');
      } else {
        // Create new car rental - pass tripId and formData
        savedCarRental = await carRentalsApi.create(tripId, formData);
        tripStoreActions.addCarRental(savedCarRental);
        // Invalidate cache after create
        dataService.invalidateCache('all');
      }

      if (onSuccess) {
        onSuccess(savedCarRental);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save car rental';
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
  title={carRentalId ? 'Edit Car Rental' : 'Add Car Rental'}
  submitLabel={carRentalId ? 'Update Car Rental' : 'Add Car Rental'}
  isLoading={loading}
  error={error}
  itemType="car-rental"
  itemColor="#8b5cf6"
  isEditing={!!carRentalId}
  onCancel={handleCancel}
  onDelete={() => {}}
>
  <TextInput
    label="Rental Company"
    value={formData.company}
    on:change={(e) => (formData.company = e.target?.value || '')}
    required={true}
    placeholder="Hertz, Enterprise, Avis"
  />

  <TextInput
    label="Vehicle"
    value={formData.vehicle}
    on:change={(e) => (formData.vehicle = e.target?.value || '')}
    placeholder="Toyota Camry"
  />

  <div class="two-column">
    <TextInput
      label="Pickup Location"
      value={formData.pickupLocation}
      on:change={(e) => (formData.pickupLocation = e.target?.value || '')}
      placeholder="Pickup address or airport"
    />

    <TextInput
      label="Dropoff Location"
      value={formData.dropoffLocation}
      on:change={(e) => (formData.dropoffLocation = e.target?.value || '')}
      placeholder="Dropoff address or airport"
    />
  </div>

  <div class="two-column">
    <div>
      <label class="input-label">Pickup Date</label>
      <input
        type="date"
        bind:value={formData.pickupDate}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Pickup Time</label>
      <input
        type="time"
        bind:value={formData.pickupTime}
        class="form-input"
      />
    </div>
  </div>

  <div class="two-column">
    <div>
      <label class="input-label">Dropoff Date</label>
      <input
        type="date"
        bind:value={formData.dropoffDate}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Dropoff Time</label>
      <input
        type="time"
        bind:value={formData.dropoffTime}
        class="form-input"
      />
    </div>
  </div>

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

  <Select
    label="Insurance"
    value={formData.insuranceType}
    options={insuranceOptions}
    on:change={(e) => (formData.insuranceType = e.target?.value || 'none')}
  />

  <Textarea
    label="Notes"
    value={formData.notes}
    on:change={(e) => (formData.notes = e.target?.value || '')}
    placeholder="Additional car rental information..."
    rows={3}
  />

  <div slot="actions" class="form-actions">
    <button type="submit" disabled={loading} class="btn btn-primary">
      {carRentalId ? 'Update Car Rental' : 'Add Car Rental'}
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
