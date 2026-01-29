<script lang="ts">
  import { transportationApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import { validateTransportation } from '$lib/utils/validation';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import Select from './Select.svelte';
  import BaseItemForm from './BaseItemForm.svelte';

  export let tripId: string;
  export let transportationId: string | null = null;
  export let transportation: any = null;
  export let onSuccess: ((transportation: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

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

  // Auto-sync arrival date when departure date changes
  $: if (formData.departureDate) {
    formData.arrivalDate = formData.departureDate;
  }

  // Auto-sync departure date when arrival date changes
  $: if (formData.arrivalDate) {
    if (!formData.departureDate || formData.arrivalDate < formData.departureDate) {
      formData.departureDate = formData.arrivalDate;
    }
  }

  async function handleSubmit() {
    let savedTransportation;
    if (transportationId) {
      savedTransportation = await transportationApi.update(transportationId, formData);
      tripStoreActions.updateTransportation(transportationId, savedTransportation);
      dataService.invalidateCache('trip');
    } else {
      savedTransportation = await transportationApi.create(tripId, formData);
      tripStoreActions.addTransportation(savedTransportation);
      dataService.invalidateCache('all');
    }

    if (onSuccess) {
      onSuccess(savedTransportation);
    }
  }

  let loading = false;
  let error: string | null = null;
</script>

<BaseItemForm
  title={transportationId ? 'Edit Transportation' : 'Add Transportation'}
  submitLabel={transportationId ? 'Update Transportation' : 'Add Transportation'}
  itemType="transportation"
  itemColor="#06b6d4"
  itemId={transportationId}
  tripId={tripId}
  bind:loading
  bind:error
  bind:formData
  validationFn={validateTransportation}
  onSubmit={handleSubmit}
  onCancel={onCancel}
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

</BaseItemForm>
