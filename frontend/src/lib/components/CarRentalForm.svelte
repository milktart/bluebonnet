<script lang="ts">
  import { carRentalsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import { validateCarRental } from '$lib/utils/validation';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import Select from './Select.svelte';
  import BaseItemForm from './BaseItemForm.svelte';

  export let tripId: string;
  export let carRentalId: string | null = null;
  export let carRental: any = null;
  export let onSuccess: ((carRental: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let formData = {
    tripId,
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

  // Auto-sync dropoff date when pickup date changes
  $: if (formData.pickupDate) {
    formData.dropoffDate = formData.pickupDate;
  }

  // Auto-sync pickup date when dropoff date changes
  $: if (formData.dropoffDate) {
    if (!formData.pickupDate || formData.dropoffDate < formData.pickupDate) {
      formData.pickupDate = formData.dropoffDate;
    }
  }

  async function handleSubmit() {
    let savedCarRental;
    if (carRentalId) {
      savedCarRental = await carRentalsApi.update(carRentalId, formData);
      tripStoreActions.updateCarRental(carRentalId, savedCarRental);
      dataService.invalidateCache('trip');
    } else {
      savedCarRental = await carRentalsApi.create(tripId, formData);
      tripStoreActions.addCarRental(savedCarRental);
      dataService.invalidateCache('all');
    }

    if (onSuccess) {
      onSuccess(savedCarRental);
    }
  }

  let loading = false;
  let error: string | null = null;
</script>

<BaseItemForm
  title={carRentalId ? 'Edit Car Rental' : 'Add Car Rental'}
  submitLabel={carRentalId ? 'Update Car Rental' : 'Add Car Rental'}
  itemType="car-rental"
  itemColor="#8b5cf6"
  itemId={carRentalId}
  tripId={tripId}
  bind:loading
  bind:error
  bind:formData
  validationFn={validateCarRental}
  onSubmit={handleSubmit}
  onCancel={onCancel}
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

</BaseItemForm>
