<script lang="ts">
  import { eventsApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import TextInput from './TextInput.svelte';
  import Textarea from './Textarea.svelte';
  import DateTimePicker from './DateTimePicker.svelte';
  import Select from './Select.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import FormContainer from './FormContainer.svelte';

  export let tripId: string;
  export let eventId: string | null = null;
  export let event: any = null;
  export let onSuccess: ((event: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    tripId: tripId,
    name: event?.name || '',
    description: event?.description || '',
    location: event?.location || '',
    date: event?.date || '',
    time: event?.time || '',
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

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.name.trim()) {
        error = 'Event name is required';
        return;
      }

      if (!formData.date) {
        error = 'Event date is required';
        return;
      }

      loading = true;
      error = null;

      let savedEvent;
      if (eventId) {
        // Update existing event
        savedEvent = await eventsApi.update(eventId, formData);
        tripStoreActions.updateEvent(eventId, savedEvent);
      } else {
        // Create new event - pass tripId and formData
        savedEvent = await eventsApi.create(tripId, formData);
        tripStoreActions.addEvent(savedEvent);
      }

      if (onSuccess) {
        onSuccess(savedEvent);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save event';
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
  title={eventId ? 'Edit Event' : 'Add Event'}
  submitLabel={eventId ? 'Update Event' : 'Add Event'}
  isLoading={loading}
  error={error}
  itemType="event"
  itemColor="#f59e0b"
  isEditing={!!eventId}
  onCancel={handleCancel}
  onDelete={() => {}}
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
        bind:value={formData.date}
        required={true}
        class="form-input"
      />
    </div>

    <div>
      <label class="input-label">Event Time</label>
      <input
        type="time"
        bind:value={formData.time}
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

  <div slot="actions" class="form-actions">
    <button type="submit" disabled={loading} class="btn btn-primary">
      {eventId ? 'Update Event' : 'Add Event'}
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
