<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FlightForm from './FlightForm.svelte';
  import HotelForm from './HotelForm.svelte';
  import TransportationForm from './TransportationForm.svelte';
  import CarRentalForm from './CarRentalForm.svelte';
  import EventForm from './EventForm.svelte';
  import TripForm from './TripForm.svelte';

  export let formType: 'trip' | 'flight' | 'hotel' | 'transportation' | 'carRental' | 'event' | null = null;
  export let tripId: string | null = null;
  export let itemId: string | null = null;
  export let data: any = null;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch('close');
  }

  function handleSuccess(event: any) {
    dispatch('success', event.detail);
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

{#if formType}
  <div class="mobile-form-modal-overlay" on:click={handleClose} role="presentation" />
  <div class="mobile-form-modal">
    <div class="form-header">
      <h2 class="form-title">
        {#if formType === 'trip'}
          {itemId ? 'Edit Trip' : 'New Trip'}
        {:else if formType === 'flight'}
          {itemId ? 'Edit Flight' : 'New Flight'}
        {:else if formType === 'hotel'}
          {itemId ? 'Edit Hotel' : 'New Hotel'}
        {:else if formType === 'transportation'}
          {itemId ? 'Edit Transportation' : 'New Transportation'}
        {:else if formType === 'carRental'}
          {itemId ? 'Edit Car Rental' : 'New Car Rental'}
        {:else if formType === 'event'}
          {itemId ? 'Edit Event' : 'New Event'}
        {/if}
      </h2>
      <button class="close-button" on:click={handleClose} aria-label="Close form">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <div class="form-content">
      {#if formType === 'trip'}
        <TripForm {tripId} {data} onSuccess={handleSuccess} onCancel={handleCancel} />
      {:else if formType === 'flight'}
        <FlightForm {tripId} {itemId} {data} onSuccess={handleSuccess} onCancel={handleCancel} />
      {:else if formType === 'hotel'}
        <HotelForm {tripId} {itemId} {data} onSuccess={handleSuccess} onCancel={handleCancel} />
      {:else if formType === 'transportation'}
        <TransportationForm {tripId} {itemId} {data} onSuccess={handleSuccess} onCancel={handleCancel} />
      {:else if formType === 'carRental'}
        <CarRentalForm {tripId} {itemId} {data} onSuccess={handleSuccess} onCancel={handleCancel} />
      {:else if formType === 'event'}
        <EventForm {tripId} {itemId} {data} onSuccess={handleSuccess} onCancel={handleCancel} />
      {/if}
    </div>
  </div>
{/if}

<style>
  .mobile-form-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 40;
    animation: fadeIn 0.3s ease-out;
  }

  .mobile-form-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    background: white;
    border-radius: 1rem 1rem 0 0;
    display: flex;
    flex-direction: column;
    z-index: 50;
    animation: slideUp 0.3s ease-out;
    box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.15);
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0px));
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .form-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    min-width: 44px;
    min-height: 44px;
  }

  .close-button:active {
    background: #f3f4f6;
    color: #111827;
  }

  .close-button :global(.material-symbols-outlined) {
    font-size: 1.5rem;
  }

  .form-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  /* Landscape mode - reduce max height */
  @media (max-height: 600px) {
    .mobile-form-modal {
      max-height: 95vh;
    }
  }

  /* Tablet and desktop - hide */
  @media (min-width: 640px) {
    .mobile-form-modal-overlay,
    .mobile-form-modal {
      display: none;
    }
  }
</style>
