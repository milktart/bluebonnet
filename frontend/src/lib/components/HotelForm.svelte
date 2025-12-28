<script lang="ts">
  import { hotelsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import DateTimePicker from './DateTimePicker.svelte';
  import Select from './Select.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import FormContainer from './FormContainer.svelte';

  export let tripId: string;
  export let hotelId: string | null = null;
  export let hotel: any = null;
  export let onSuccess: ((hotel: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    tripId: tripId,
    hotelName: hotel?.hotelName || hotel?.name || '',
    address: hotel?.address || '',
    phone: hotel?.phone || hotel?.phoneNumber || '',
    checkInDate: hotel?.checkInDate || '',
    checkInTime: hotel?.checkInTime || '14:00',
    checkOutDate: hotel?.checkOutDate || '',
    checkOutTime: hotel?.checkOutTime || '11:00',
    confirmationNumber: hotel?.confirmationNumber || '',
    roomNumber: hotel?.roomNumber || ''
  };

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.hotelName.trim()) {
        error = 'Hotel name is required';
        return;
      }

      if (!formData.address.trim()) {
        error = 'Address is required';
        return;
      }

      if (!formData.checkInDate) {
        error = 'Check-in date is required';
        return;
      }

      loading = true;
      error = null;

      let savedHotel;
      if (hotelId) {
        // Update existing hotel
        savedHotel = await hotelsApi.update(hotelId, formData);
        tripStoreActions.updateHotel(hotelId, savedHotel);
      } else {
        // Create new hotel - pass tripId and formData
        savedHotel = await hotelsApi.create(tripId, formData);
        tripStoreActions.addHotel(savedHotel);
      }

      if (onSuccess) {
        onSuccess(savedHotel);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save hotel';
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
  title={hotelId ? 'Edit Hotel' : 'Add Hotel'}
  submitLabel={hotelId ? 'Update Hotel' : 'Add Hotel'}
  isLoading={loading}
  error={error}
  itemType="hotel"
  itemColor="#ec4899"
  isEditing={!!hotelId}
  onCancel={handleCancel}
  onDelete={() => {}}
>
  <TextInput
    label="Hotel Name"
    value={formData.hotelName}
    on:change={(e) => (formData.hotelName = e.target?.value || '')}
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
        value="14:00"
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
        value="11:00"
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

  <div slot="actions" class="form-actions">
    <button type="submit" disabled={loading} class="btn btn-primary">
      {hotelId ? 'Update Hotel' : 'Add Hotel'}
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
