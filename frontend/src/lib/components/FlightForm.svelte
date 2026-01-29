<script lang="ts">
  import { flightsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import { validateFlight } from '$lib/utils/validation';
  import TextInput from './TextInput.svelte';
  import BaseItemForm from './BaseItemForm.svelte';

  export let tripId: string;
  export let flightId: string | null = null;
  export let flight: any = null;
  export let onSuccess: ((flight: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  // Helper function to parse dateTime into separate date and time
  function parseDateTime(dateTimeStr: string): { date: string; time: string } {
    if (!dateTimeStr) return { date: '', time: '' };
    try {
      const dt = new Date(dateTimeStr);
      const date = dt.toISOString().split('T')[0];
      const time = dt.toTimeString().slice(0, 5);
      return { date, time };
    } catch (e) {
      return { date: '', time: '' };
    }
  }

  const departureDateTime = parseDateTime(flight?.departureDateTime || '');
  const arrivalDateTime = parseDateTime(flight?.arrivalDateTime || '');

  let formData = {
    tripId: tripId,
    airline: flight?.airline || '',
    flightNumber: flight?.flightNumber || '',
    origin: flight?.origin || '',
    destination: flight?.destination || '',
    departureDate: flight?.departureDate || departureDateTime.date || '',
    departureTime: flight?.departureTime || departureDateTime.time || '',
    arrivalDate: flight?.arrivalDate || arrivalDateTime.date || '',
    arrivalTime: flight?.arrivalTime || arrivalDateTime.time || '',
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
    let savedFlight;
    if (flightId) {
      savedFlight = await flightsApi.update(flightId, formData);
      tripStoreActions.updateFlight(flightId, savedFlight);
      dataService.invalidateCache('trip');
    } else {
      savedFlight = await flightsApi.create(tripId, formData);
      tripStoreActions.addFlight(savedFlight);
      dataService.invalidateCache('all');
    }

    if (onSuccess) {
      onSuccess(savedFlight);
    }
  }

  let loading = false;
  let error: string | null = null;
</script>

<BaseItemForm
  title={flightId ? 'Edit Flight' : 'Add Flight'}
  submitLabel={flightId ? 'Update Flight' : 'Add Flight'}
  itemType="flight"
  itemColor="#3b82f6"
  itemId={flightId}
  tripId={tripId}
  bind:loading
  bind:error
  bind:formData
  validationFn={validateFlight}
  onSubmit={handleSubmit}
  onCancel={onCancel}
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
</BaseItemForm>
