<script lang="ts">
  import { hotelsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import { validateHotel } from '$lib/utils/validation';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import BaseItemForm from './BaseItemForm.svelte';

  export let tripId: string;
  export let hotelId: string | null = null;
  export let hotel: any = null;
  export let onSuccess: ((hotel: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let formData = {
    tripId,
    name: hotel?.hotelName || hotel?.name || '',
    address: hotel?.address || '',
    phone: hotel?.phone || hotel?.phoneNumber || '',
    checkInDate: hotel?.checkInDate || '',
    checkInTime: hotel?.checkInTime || '14:00',
    checkOutDate: hotel?.checkOutDate || '',
    checkOutTime: hotel?.checkOutTime || '11:00',
    confirmationNumber: hotel?.confirmationNumber || '',
    roomNumber: hotel?.roomNumber || ''
  };

  // Auto-sync check-out date when check-in date changes
  $: if (formData.checkInDate) {
    formData.checkOutDate = formData.checkInDate;
  }

  // Auto-sync check-in date when check-out date changes
  $: if (formData.checkOutDate) {
    if (!formData.checkInDate || formData.checkOutDate < formData.checkInDate) {
      formData.checkInDate = formData.checkOutDate;
    }
  }

  async function handleSubmit() {
    let savedHotel;
    if (hotelId) {
      savedHotel = await hotelsApi.update(hotelId, formData);
      tripStoreActions.updateHotel(hotelId, savedHotel);
      dataService.invalidateCache('trip');
    } else {
      savedHotel = await hotelsApi.create(tripId, formData);
      tripStoreActions.addHotel(savedHotel);
      dataService.invalidateCache('all');
    }

    if (onSuccess) {
      onSuccess(savedHotel);
    }
  }

  let loading = false;
  let error: string | null = null;
</script>

<BaseItemForm
  title={hotelId ? 'Edit Hotel' : 'Add Hotel'}
  submitLabel={hotelId ? 'Update Hotel' : 'Add Hotel'}
  itemType="hotel"
  itemColor="#ec4899"
  itemId={hotelId}
  tripId={tripId}
  bind:loading
  bind:error
  bind:formData
  validationFn={validateHotel}
  onSubmit={handleSubmit}
  onCancel={onCancel}
>
  <TextInput
    label="Hotel Name"
    value={formData.name}
    on:change={(e) => (formData.name = e.target?.value || '')}
    required={true}
    placeholder="W Bangkok"
  />

  <Textarea
    label="Address"
    value={formData.address}
    on:change={(e) => (formData.address = e.target?.value || '')}
    placeholder="Full hotel address with city and country"
    rows={2}
  />

  <TextInput
    label="Phone Number"
    value={formData.phone}
    on:change={(e) => (formData.phone = e.target?.value || '')}
    placeholder="+1-212-5550123"
  />

  <div class="two-column">
    <div>
      <label class="input-label">Check-in Date</label>
      <input
        type="date"
        bind:value={formData.checkInDate}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Check-in Time</label>
      <input
        type="time"
        bind:value={formData.checkInTime}
        class="form-input"
      />
    </div>
  </div>

  <div class="two-column">
    <div>
      <label class="input-label">Check-out Date</label>
      <input
        type="date"
        bind:value={formData.checkOutDate}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Check-out Time</label>
      <input
        type="time"
        bind:value={formData.checkOutTime}
        class="form-input"
      />
    </div>
  </div>

  <div class="two-column">
    <TextInput
      label="Confirmation Number"
      value={formData.confirmationNumber}
      on:change={(e) => (formData.confirmationNumber = e.target?.value || '')}
      placeholder="Booking confirmation number"
    />

    <TextInput
      label="Room Number"
      value={formData.roomNumber}
      on:change={(e) => (formData.roomNumber = e.target?.value || '')}
      placeholder="1205"
    />
  </div>
</BaseItemForm>
