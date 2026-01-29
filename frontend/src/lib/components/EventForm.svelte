<script lang="ts">
  import { eventsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import { validateEvent } from '$lib/utils/validation';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import Select from './Select.svelte';
  import BaseItemForm from './BaseItemForm.svelte';

  export let tripId: string;
  export let eventId: string | null = null;
  export let event: any = null;
  export let onSuccess: ((event: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  // Helper function to parse startDateTime/endDateTime into separate date and time
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

  const startDateTime = parseDateTime(event?.startDateTime || '');
  const endDateTime = parseDateTime(event?.endDateTime || '');

  let formData = {
    tripId: tripId,
    name: event?.name || '',
    description: event?.description || '',
    location: event?.location || '',
    startDate: event?.startDate || startDateTime.date || '',
    startTime: event?.startTime || startDateTime.time || '',
    endDate: event?.endDate || endDateTime.date || '',
    endTime: event?.endTime || endDateTime.time || '',
    category: event?.category || 'activity',
    ticketNumber: event?.ticketNumber || '',
    cost: event?.cost || '',
    url: event?.url || '',
    notes: event?.notes || ''
  };

  const categoryOptions = [
    { value: 'activity', label: 'Activity' },
    { value: 'dining', label: 'Dining' },
    { value: 'show', label: 'Show/Entertainment' },
    { value: 'tour', label: 'Tour' },
    { value: 'sports', label: 'Sports' },
    { value: 'museum', label: 'Museum' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'other', label: 'Other' }
  ];

  // Auto-sync end date when start date changes
  $: if (formData.startDate) {
    formData.endDate = formData.startDate;
  }

  // Auto-sync start date when end date changes
  $: if (formData.endDate) {
    if (!formData.startDate || formData.endDate < formData.startDate) {
      formData.startDate = formData.endDate;
    }
  }

  async function handleSubmit() {
    let savedEvent;
    if (eventId) {
      savedEvent = await eventsApi.update(eventId, formData);
      tripStoreActions.updateEvent(eventId, savedEvent);
      dataService.invalidateCache('trip');
    } else {
      savedEvent = await eventsApi.create(tripId, formData);
      tripStoreActions.addEvent(savedEvent);
      dataService.invalidateCache('all');
    }

    if (onSuccess) {
      onSuccess(savedEvent);
    }
  }

  let loading = false;
  let error: string | null = null;
</script>

<BaseItemForm
  title={eventId ? 'Edit Event' : 'Add Event'}
  submitLabel={eventId ? 'Update Event' : 'Add Event'}
  itemType="event"
  itemColor="#f59e0b"
  itemId={eventId}
  tripId={tripId}
  bind:loading
  bind:error
  bind:formData
  validationFn={validateEvent}
  onSubmit={handleSubmit}
  onCancel={onCancel}
>
  <TextInput
    label="Event Name"
    value={formData.name}
    on:change={(e) => (formData.name = e.target?.value || '')}
    required={true}
    placeholder="e.g., Eiffel Tower Visit"
  />

  <TextInput
    label="Location"
    value={formData.location}
    on:change={(e) => (formData.location = e.target?.value || '')}
    placeholder="Event location"
  />

  <div class="two-column">
    <div>
      <label class="input-label">Event Date</label>
      <input
        type="date"
        bind:value={formData.startDate}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Event Time</label>
      <input
        type="time"
        bind:value={formData.startTime}
        class="form-input"
      />
    </div>
  </div>

  <div class="two-column">
    <Select
      label="Category"
      value={formData.category}
      options={categoryOptions}
      on:change={(e) => (formData.category = e.target?.value || 'activity')}
    />

    <TextInput
      label="Ticket Number"
      value={formData.ticketNumber}
      on:change={(e) => (formData.ticketNumber = e.target?.value || '')}
      placeholder="Ticket or reservation #"
    />
  </div>

  <Textarea
    label="Description"
    value={formData.description}
    on:change={(e) => (formData.description = e.target?.value || '')}
    placeholder="Event details and notes..."
    rows={3}
  />
</BaseItemForm>
