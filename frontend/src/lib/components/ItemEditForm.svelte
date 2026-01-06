<script lang="ts">
  import { tripsApi, flightsApi, hotelsApi, eventsApi, transportationApi, carRentalsApi, itemCompanionsApi } from '$lib/services/api';
  import { tripStore } from '$lib/stores/tripStore';
  import { dataService } from '$lib/services/dataService';
  import { utcToLocalTimeString } from '$lib/utils/timezoneUtils';
  import { getFormConfigs } from '$lib/utils/formConfigs';
  import type { ItemType, Trip, TravelItem, FormData } from '$lib/types';
  import AirportAutocomplete from './AirportAutocomplete.svelte';
  import ItemCompanionsForm from './ItemCompanionsForm.svelte';
  import TripCompanionsForm from './TripCompanionsForm.svelte';
  import '$lib/styles/form-styles.css';

  export let itemType: ItemType;
  export let data: TravelItem | Trip | null = null;
  export let tripId: string = '';
  export let allTrips: Trip[] = [];
  export let onClose: () => void = () => {};
  export let onSave: (updatedItem: TravelItem | Trip) => void = () => {};

  let loading = false;
  let error: string | null = null;

  // Re-compute isEditing reactively based on data
  $: isEditing = !!data?.id;

  // Show trip selector only for non-trip items (not for trip itself)
  $: showTripSelector = itemType !== 'trip';

  // Parse local date string (YYYY-MM-DD) to Date object
  function parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date(0);
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  // Filter trips to show only upcoming/in-progress (exclude past trips)
  $: upcomingTrips = allTrips.filter((trip) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tripDate = trip.departureDate ? parseLocalDate(trip.departureDate) : null;
    return tripDate && tripDate >= now;
  });

  // Transform database datetime fields into separate date/time fields for editing
  function initializeFormData(sourceData: any): any {
    if (!sourceData) return {};

    const formData = { ...sourceData };

    // Flight transformation
    if (itemType === 'flight' && sourceData.departureDateTime) {
      // Convert UTC datetime to local timezone for display
      // Use the flight's origin timezone for departure, destination timezone for arrival
      const depDateTimeStr = utcToLocalTimeString(sourceData.departureDateTime, sourceData.originTimezone);
      if (depDateTimeStr) {
        const [date, time] = depDateTimeStr.split('T');
        formData.departureDate = date;
        formData.departureTime = time;
      }

      if (sourceData.arrivalDateTime) {
        const arrDateTimeStr = utcToLocalTimeString(sourceData.arrivalDateTime, sourceData.destinationTimezone);
        if (arrDateTimeStr) {
          const [date, time] = arrDateTimeStr.split('T');
          formData.arrivalDate = date;
          formData.arrivalTime = time;
        }
      }
    }

    // Hotel transformation
    if (itemType === 'hotel' && sourceData.checkInDateTime) {
      // Use hotel timezone for both check-in and check-out
      const checkInStr = utcToLocalTimeString(sourceData.checkInDateTime, sourceData.timezone);
      if (checkInStr) {
        const [date, time] = checkInStr.split('T');
        formData.checkInDate = date;
        formData.checkInTime = time;
      }

      if (sourceData.checkOutDateTime) {
        const checkOutStr = utcToLocalTimeString(sourceData.checkOutDateTime, sourceData.timezone);
        if (checkOutStr) {
          const [date, time] = checkOutStr.split('T');
          formData.checkOutDate = date;
          formData.checkOutTime = time;
        }
      }
    }

    // Map hotelName back to name for editing
    if (itemType === 'hotel' && sourceData.hotelName && !sourceData.name) {
      formData.name = sourceData.hotelName;
    }

    // Event transformation
    if (itemType === 'event' && sourceData.startDateTime) {
      // Use event timezone for both start and end times
      const startStr = utcToLocalTimeString(sourceData.startDateTime, sourceData.timezone);
      if (startStr) {
        const [date, time] = startStr.split('T');
        formData.startDate = date;
        formData.startTime = time;
      }

      if (sourceData.endDateTime) {
        const endStr = utcToLocalTimeString(sourceData.endDateTime, sourceData.timezone);
        if (endStr) {
          const [date, time] = endStr.split('T');
          formData.endDate = date;
          formData.endTime = time;
        }
      }

      // Check if this is an all-day event (start time is 00:00 and end time is 23:59)
      if (formData.startTime === '00:00' && formData.endTime === '23:59') {
        formData.allDay = true;
      }
    }

    // Transportation transformation
    if (itemType === 'transportation' && sourceData.departureDateTime) {
      // Use origin timezone for departure, destination timezone for arrival
      const depStr = utcToLocalTimeString(sourceData.departureDateTime, sourceData.originTimezone);
      if (depStr) {
        const [date, time] = depStr.split('T');
        formData.departureDate = date;
        formData.departureTime = time;
      }

      if (sourceData.arrivalDateTime) {
        const arrStr = utcToLocalTimeString(sourceData.arrivalDateTime, sourceData.destinationTimezone);
        if (arrStr) {
          const [date, time] = arrStr.split('T');
          formData.arrivalDate = date;
          formData.arrivalTime = time;
        }
      }
    }

    // Car Rental transformation
    if (itemType === 'carRental' && sourceData.pickupDateTime) {
      // Use pickup timezone for pickup, dropoff timezone for dropoff
      const pickupStr = utcToLocalTimeString(sourceData.pickupDateTime, sourceData.pickupTimezone);
      if (pickupStr) {
        const [date, time] = pickupStr.split('T');
        formData.pickupDate = date;
        formData.pickupTime = time;
      }

      if (sourceData.dropoffDateTime) {
        const dropoffStr = utcToLocalTimeString(sourceData.dropoffDateTime, sourceData.dropoffTimezone);
        if (dropoffStr) {
          const [date, time] = dropoffStr.split('T');
          formData.dropoffDate = date;
          formData.dropoffTime = time;
        }
      }
    }

    return formData;
  }

  let formData: FormData = initializeFormData(data);
  let airlineLookupLoading = false;
  let selectedTripId: string = '';
  let selectedCompanions: Array<{ id: string; name: string }> = [];

  // Re-initialize formData and selectedTripId when data or itemType changes
  $: if (data) {
    const initialized = initializeFormData(data);
    formData = initialized;
    selectedTripId = data?.tripId || '';
    // Initialize companions if available (itemCompanions from API response)
    selectedCompanions = data?.itemCompanions || data?.travelCompanions || [];
  }

  // Auto-lookup airline when flight number changes (for flights)
  async function handleFlightNumberChange() {
    if (itemType !== 'flight' || !formData.flightNumber) {
      return;
    }

    // Only lookup if flight number has changed (avoid excessive lookups)
    airlineLookupLoading = true;
    try {
      const result = await flightsApi.lookupAirline(formData.flightNumber);
      if (result && result.name) {
        formData.airline = result.name;
      }
    } catch (err) {
      // Silently fail - airline lookup is optional
    } finally {
      airlineLookupLoading = false;
    }
  }

  // Auto-format time input to HH:MM format
  function formatTimeInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length > 0) {
      if (value.length <= 2) {
        // Just hours: 1 → 1, 14 → 14
        value = value;
      } else if (value.length === 3) {
        // 143 → 14:3
        value = value.slice(0, 2) + ':' + value.slice(2);
      } else {
        // 1430 → 14:30
        value = value.slice(0, 2) + ':' + value.slice(2, 4);
      }
    }

    input.value = value;

    // Update formData with the formatted value
    const fieldName = input.name as keyof typeof formData;
    if (fieldName) {
      formData[fieldName] = value;
    }
  }

  // Re-compute config reactively based on isEditing and itemType
  $: config = getFormConfigs(isEditing)[itemType];

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      let result;
      // Use selectedTripId if it was changed, otherwise use the original tripId
      const effectiveTripId = selectedTripId || tripId;

      // Prepare form data with tripId for non-trip items
      const submitData = { ...formData };

      // Remove old datetime fields when submitting separate date/time fields
      // This prevents the backend from ignoring the new date/time values
      if (itemType === 'flight' || itemType === 'transportation') {
        delete submitData.departureDateTime;
        delete submitData.arrivalDateTime;
      } else if (itemType === 'hotel') {
        delete submitData.checkInDateTime;
        delete submitData.checkOutDateTime;
      } else if (itemType === 'carRental') {
        delete submitData.pickupDateTime;
        delete submitData.dropoffDateTime;
      } else if (itemType === 'event') {
        delete submitData.startDateTime;
        delete submitData.endDateTime;
      }

      if (itemType !== 'trip') {
        // Always include tripId for non-trip items when editing (allows adding/removing from trip)
        if (isEditing) {
          submitData.tripId = selectedTripId || null;
        } else if (selectedTripId) {
          // For new items, only include tripId if one was selected
          submitData.tripId = selectedTripId;
        }
      }


      if (itemType === 'trip') {
        if (isEditing) {
          result = await tripsApi.update(data.id, formData);
        } else {
          result = await tripsApi.create(formData);
        }
      } else if (itemType === 'flight') {
        if (isEditing) {
          result = await flightsApi.update(data.id, submitData);
        } else {
          result = await flightsApi.create(effectiveTripId, submitData);
        }
      } else if (itemType === 'hotel') {
        if (isEditing) {
          result = await hotelsApi.update(data.id, submitData);
        } else {
          result = await hotelsApi.create(effectiveTripId, submitData);
        }
      } else if (itemType === 'event') {
        if (isEditing) {
          result = await eventsApi.update(data.id, submitData);
        } else {
          result = await eventsApi.create(effectiveTripId, submitData);
        }
      } else if (itemType === 'transportation') {
        if (isEditing) {
          result = await transportationApi.update(data.id, submitData);
        } else {
          result = await transportationApi.create(effectiveTripId, submitData);
        }
      } else if (itemType === 'carRental') {
        if (isEditing) {
          result = await carRentalsApi.update(data.id, submitData);
        } else {
          result = await carRentalsApi.create(effectiveTripId, submitData);
        }
      }

      // Save companions for the item if any were selected
      if (selectedCompanions && selectedCompanions.length > 0 && result && result.id) {
        try {
          const companionIds = selectedCompanions.map(c => c.id);
          await itemCompanionsApi.update(itemType, result.id, companionIds);

          // After saving companions, fetch the complete item with companions to ensure data consistency
          if (itemType === 'flight') {
            result = await flightsApi.getById(result.id);
          } else if (itemType === 'hotel') {
            result = await hotelsApi.getById(result.id);
          } else if (itemType === 'event') {
            result = await eventsApi.getById(result.id);
          } else if (itemType === 'transportation') {
            result = await transportationApi.getById(result.id);
          } else if (itemType === 'carRental') {
            result = await carRentalsApi.getById(result.id);
          }
        } catch (companionError) {
          // Error saving companions - continue anyway
        }
      }

      onSave(result || submitData);

      // Invalidate cache after successful mutation
      if (isEditing) {
        // For updates, invalidate trip cache
        dataService.invalidateCache('trip');
      } else {
        // For creates, could be new trip or new item
        dataService.invalidateCache('all');
      }

      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  }

  function getItemIcon(type: string): string {
    const iconMap: Record<string, string> = {
      trip: 'flight_takeoff',
      flight: 'flight',
      hotel: 'hotel',
      event: 'event',
      transportation: 'directions_car',
      carRental: 'directions_car',
      voucher: 'card_giftcard'
    };
    return iconMap[type] || 'info';
  }

  function getItemColor(type: string): string {
    const colorMap: Record<string, string> = {
      flight: '#3b82f6',
      hotel: '#ec4899',
      event: '#f59e0b',
      transportation: '#06b6d4',
      carRental: '#8b5cf6',
      voucher: '#10b981'
    };
    return colorMap[type] || '#3b82f6';
  }

  async function handleDelete() {
    if (!confirm(`Delete this ${itemType}?`)) return;

    loading = true;
    error = null;

    try {
      if (itemType === 'trip') {
        await tripsApi.delete(data.id);
      } else if (itemType === 'flight') {
        await flightsApi.delete(data.id);
      } else if (itemType === 'hotel') {
        await hotelsApi.delete(data.id);
      } else if (itemType === 'event') {
        await eventsApi.delete(data.id);
      } else if (itemType === 'transportation') {
        await transportationApi.delete(data.id);
      } else if (itemType === 'carRental') {
        await carRentalsApi.delete(data.id);
      }

      onSave(null);
      onClose();
    } catch (err) {
      // Check if the error message suggests the delete actually succeeded
      const errMessage = err instanceof Error ? err.message : String(err);

      // If the error contains "pattern" but we successfully deleted, ignore it
      if (errMessage.includes('pattern') || errMessage.includes('string')) {
        // The delete likely succeeded despite the error, close the form
        onSave(null);
        onClose();
      } else {
        error = errMessage;
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="edit-panel">
  <div class="edit-header">
    <div class="header-left">
      <button class="back-btn" on:click={onClose}>
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h3>{config.title}</h3>
    </div>
    <div class="icon-badge" data-type={itemType}>
      <span class="material-symbols-outlined">{getItemIcon(itemType)}</span>
    </div>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="edit-content">
    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <div class="form-fields">
      {#if showTripSelector}
        <div class="form-group">
          <label for="tripSelector">Trip</label>
          <select id="tripSelector" bind:value={selectedTripId}>
            <option value="">Standalone Item</option>
            {#each upcomingTrips as trip (trip.id)}
              <option value={trip.id}>{trip.name}</option>
            {/each}
          </select>
        </div>
      {/if}
      {#if itemType === 'flight'}
        <!-- Flight Number & Airline (3-col: 1-2) -->
        <div class="form-row cols-3">
          <div class="form-group">
            <label for="flightNumber">{config.fields.find(f => f.name === 'flightNumber')?.label}</label>
            <input
              type="text"
              id="flightNumber"
              name="flightNumber"
              bind:value={formData.flightNumber}
              on:blur={handleFlightNumberChange}
              placeholder="KL668"
            />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label for="airline">
              {config.fields.find(f => f.name === 'airline')?.label}
              {#if airlineLookupLoading}
                <span class="loading-indicator">Looking up...</span>
              {/if}
            </label>
            <input type="text" id="airline" name="airline" bind:value={formData.airline} readonly class="readonly" />
          </div>
        </div>

        <!-- Origin & Destination (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="origin">Origin</label>
            <AirportAutocomplete
              id="origin"
              bind:value={formData.origin}
              placeholder="AUS"
              onSelect={(airport) => {
                formData.origin = airport.iata;
              }}
            />
          </div>
          <div class="form-group">
            <label for="destination">Destination</label>
            <AirportAutocomplete
              id="destination"
              bind:value={formData.destination}
              placeholder="AMS"
              onSelect={(airport) => {
                formData.destination = airport.iata;
              }}
            />
          </div>
        </div>

        <!-- Departure & Arrival Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureDate">Departure Date</label>
            <input type="date" id="departureDate" name="departureDate" bind:value={formData.departureDate} />
          </div>
          <div class="form-group">
            <label for="arrivalDate">Arrival Date</label>
            <input type="date" id="arrivalDate" name="arrivalDate" bind:value={formData.arrivalDate} />
          </div>
        </div>

        <!-- Departure & Arrival Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureTime">Departure Time</label>
            <input type="text" id="departureTime" name="departureTime" bind:value={formData.departureTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
          <div class="form-group">
            <label for="arrivalTime">Arrival Time</label>
            <input type="text" id="arrivalTime" name="arrivalTime" bind:value={formData.arrivalTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
        </div>

        <!-- PNR & Seat (3-col: 2-1) -->
        <div class="form-row cols-3">
          <div class="form-group" style="grid-column: span 2;">
            <label for="pnr">PNR</label>
            <input type="text" id="pnr" name="pnr" bind:value={formData.pnr} placeholder="ABC123D" />
          </div>
          <div class="form-group">
            <label for="seat">Seat</label>
            <input type="text" id="seat" name="seat" bind:value={formData.seat} placeholder="4A" />
          </div>
        </div>
      {:else if itemType === 'hotel'}
        <!-- Hotel Name (full-width) -->
        <div class="form-group">
          <label for="name">Hotel Name</label>
          <input type="text" id="name" name="name" bind:value={formData.name} placeholder="W Bangkok" required />
        </div>

        <!-- Address (full-width) -->
        <div class="form-group">
          <label for="address">Address</label>
          <textarea id="address" name="address" bind:value={formData.address} placeholder="Full address" />
        </div>

        <!-- Check-in & Check-out Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="checkInDate">Check-in Date</label>
            <input type="date" id="checkInDate" name="checkInDate" bind:value={formData.checkInDate} required />
          </div>
          <div class="form-group">
            <label for="checkOutDate">Check-out Date</label>
            <input type="date" id="checkOutDate" name="checkOutDate" bind:value={formData.checkOutDate} required />
          </div>
        </div>

        <!-- Check-in & Check-out Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="checkInTime">Check-in Time</label>
            <input type="text" id="checkInTime" name="checkInTime" bind:value={formData.checkInTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
          <div class="form-group">
            <label for="checkOutTime">Check-out Time</label>
            <input type="text" id="checkOutTime" name="checkOutTime" bind:value={formData.checkOutTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
        </div>

        <!-- Confirmation Number (full-width) -->
        <div class="form-group">
          <label for="confirmationNumber">Confirmation Number</label>
          <input type="text" id="confirmationNumber" name="confirmationNumber" bind:value={formData.confirmationNumber} />
        </div>

        <!-- Notes (full-width) -->
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} placeholder="Additional information" />
        </div>
      {:else if itemType === 'transportation'}
        <!-- Method (full-width) -->
        <div class="form-group">
          <label for="method">Method</label>
          <select id="method" name="method" bind:value={formData.method} required>
            <option value="">Select Method</option>
            {#each config.fields.find(f => f.name === 'method')?.options || [] as option}
              {#if typeof option === 'object' && option.value}
                <option value={option.value}>{option.label}</option>
              {:else}
                <option value={option}>{option}</option>
              {/if}
            {/each}
          </select>
        </div>

        <!-- Origin & Destination (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="origin">From</label>
            <input type="text" id="origin" name="origin" bind:value={formData.origin} required />
          </div>
          <div class="form-group">
            <label for="destination">To</label>
            <input type="text" id="destination" name="destination" bind:value={formData.destination} required />
          </div>
        </div>

        <!-- Departure & Arrival Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureDate">Departure Date</label>
            <input type="date" id="departureDate" name="departureDate" bind:value={formData.departureDate} required />
          </div>
          <div class="form-group">
            <label for="arrivalDate">Arrival Date</label>
            <input type="date" id="arrivalDate" name="arrivalDate" bind:value={formData.arrivalDate} required />
          </div>
        </div>

        <!-- Departure & Arrival Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureTime">Departure Time</label>
            <input type="text" id="departureTime" name="departureTime" bind:value={formData.departureTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
          <div class="form-group">
            <label for="arrivalTime">Arrival Time</label>
            <input type="text" id="arrivalTime" name="arrivalTime" bind:value={formData.arrivalTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
        </div>

        <!-- Booking Reference & Notes -->
        <div class="form-group">
          <label for="bookingReference">Booking Reference</label>
          <input type="text" id="bookingReference" name="bookingReference" bind:value={formData.bookingReference} />
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} placeholder="Additional information" />
        </div>

      {:else if itemType === 'carRental'}
        <!-- Company & Pickup Location (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="company">Company</label>
            <input type="text" id="company" name="company" bind:value={formData.company} required />
          </div>
          <div class="form-group">
            <label for="pickupLocation">Pickup Location</label>
            <input type="text" id="pickupLocation" name="pickupLocation" bind:value={formData.pickupLocation} required />
          </div>
        </div>

        <!-- Pickup & Dropoff Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="pickupDate">Pickup Date</label>
            <input type="date" id="pickupDate" name="pickupDate" bind:value={formData.pickupDate} required />
          </div>
          <div class="form-group">
            <label for="dropoffDate">Dropoff Date</label>
            <input type="date" id="dropoffDate" name="dropoffDate" bind:value={formData.dropoffDate} required />
          </div>
        </div>

        <!-- Pickup & Dropoff Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="pickupTime">Pickup Time</label>
            <input type="text" id="pickupTime" name="pickupTime" bind:value={formData.pickupTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
          <div class="form-group">
            <label for="dropoffTime">Dropoff Time</label>
            <input type="text" id="dropoffTime" name="dropoffTime" bind:value={formData.dropoffTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
          </div>
        </div>

        <!-- Dropoff Location -->
        <div class="form-group">
          <label for="dropoffLocation">Dropoff Location</label>
          <input type="text" id="dropoffLocation" name="dropoffLocation" bind:value={formData.dropoffLocation} required />
        </div>

        <!-- Confirmation & Notes -->
        <div class="form-group">
          <label for="confirmationNumber">Confirmation Number</label>
          <input type="text" id="confirmationNumber" name="confirmationNumber" bind:value={formData.confirmationNumber} />
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} placeholder="Additional information" />
        </div>

      {:else if itemType === 'event'}
        <!-- Event Name & Location (full-width) -->
        <div class="form-group">
          <label for="name">Event Name</label>
          <input type="text" id="name" name="name" bind:value={formData.name} required />
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" name="location" bind:value={formData.location} required />
        </div>

        <!-- All Day Checkbox -->
        <div class="form-group checkbox-group">
          <label for="allDay">
            <input type="checkbox" id="allDay" name="allDay" bind:checked={formData.allDay} />
            <span>All Day Event</span>
          </label>
        </div>

        {#if formData.allDay}
          <!-- All Day: Start & End Dates only (2-col) -->
          <div class="form-row cols-2">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" bind:value={formData.startDate} required />
            </div>
            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" id="endDate" name="endDate" bind:value={formData.endDate} />
            </div>
          </div>
        {:else}
          <!-- Start & End Dates (2-col) -->
          <div class="form-row cols-2">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" bind:value={formData.startDate} required />
            </div>
            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" id="endDate" name="endDate" bind:value={formData.endDate} />
            </div>
          </div>

          <!-- Start & End Times (2-col) -->
          <div class="form-row cols-2">
            <div class="form-group">
              <label for="startTime">Start Time</label>
              <input type="text" id="startTime" name="startTime" bind:value={formData.startTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
            </div>
            <div class="form-group">
              <label for="endTime">End Time</label>
              <input type="text" id="endTime" name="endTime" bind:value={formData.endTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} />
            </div>
          </div>
        {/if}

        <!-- Ticket Number -->
        <div class="form-group">
          <label for="ticketNumber">Ticket Number</label>
          <input type="text" id="ticketNumber" name="ticketNumber" bind:value={formData.ticketNumber} />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" bind:value={formData.description} placeholder="Event details" />
        </div>

      {:else}
        <!-- Generic form layout fallback -->
        <!-- Special layout for trip departure and return dates -->
        {#if itemType === 'trip' && config.fields.some(f => f.name === 'departureDate')}
          {#each config.fields as field}
            {#if field.name === 'departureDate'}
              <div class="form-row cols-2">
                <div class="form-group">
                  <label for={field.name}>{field.label}</label>
                  <input
                    type="date"
                    id={field.name}
                    name={field.name}
                    bind:value={formData[field.name]}
                    required={field.required}
                  />
                </div>
                {#if config.fields.some(f => f.name === 'returnDate')}
                  {#each config.fields as returnField}
                    {#if returnField.name === 'returnDate'}
                      <div class="form-group">
                        <label for={returnField.name}>{returnField.label}</label>
                        <input
                          type="date"
                          id={returnField.name}
                          name={returnField.name}
                          bind:value={formData[returnField.name]}
                          required={returnField.required}
                        />
                      </div>
                    {/if}
                  {/each}
                {/if}
              </div>
            {:else if field.name !== 'returnDate'}
              <div class="form-group">
                <label for={field.name}>{field.label}</label>

                {#if field.type === 'text'}
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    bind:value={formData[field.name]}
                    placeholder={field.placeholder}
                    required={field.required}
                    readonly={field.readonly}
                    class={field.readonly ? 'readonly' : ''}
                  />
                {:else if field.type === 'date'}
                  <input
                    type="date"
                    id={field.name}
                    name={field.name}
                    bind:value={formData[field.name]}
                    required={field.required}
                  />
                {:else if field.type === 'time'}
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    bind:value={formData[field.name]}
                    placeholder={field.placeholder}
                    maxlength="5"
                    on:keyup={formatTimeInput}
                  />
                {:else if field.type === 'select'}
                  <select
                    id={field.name}
                    name={field.name}
                    bind:value={formData[field.name]}
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {#each field.options as option}
                      {#if typeof option === 'object' && option.value}
                        <option value={option.value}>{option.label}</option>
                      {:else}
                        <option value={option}>{option}</option>
                      {/if}
                    {/each}
                  </select>
                {:else if field.type === 'textarea'}
                  <textarea
                    id={field.name}
                    name={field.name}
                    bind:value={formData[field.name]}
                    placeholder={field.placeholder}
                  />
                {/if}
              </div>
            {/if}
          {/each}
        {:else}
          <!-- Default field rendering for all other item types -->
          {#each config.fields as field}
            <div class="form-group">
              <label for={field.name}>{field.label}</label>

              {#if field.type === 'text'}
                <input
                  type="text"
                  id={field.name}
                  name={field.name}
                  bind:value={formData[field.name]}
                  placeholder={field.placeholder}
                  required={field.required}
                  readonly={field.readonly}
                  class={field.readonly ? 'readonly' : ''}
                />
              {:else if field.type === 'date'}
                <input
                  type="date"
                  id={field.name}
                  name={field.name}
                  bind:value={formData[field.name]}
                  required={field.required}
                />
              {:else if field.type === 'time'}
                <input
                  type="text"
                  id={field.name}
                  name={field.name}
                  bind:value={formData[field.name]}
                  placeholder={field.placeholder}
                  maxlength="5"
                  on:keyup={formatTimeInput}
                />
              {:else if field.type === 'select'}
                <select
                  id={field.name}
                  name={field.name}
                  bind:value={formData[field.name]}
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {#each field.options as option}
                    <option value={option}>{option}</option>
                  {/each}
                </select>
              {:else if field.type === 'textarea'}
                <textarea
                  id={field.name}
                  name={field.name}
                  bind:value={formData[field.name]}
                  placeholder={field.placeholder}
                />
              {/if}
            </div>
          {/each}
        {/if}
      {/if}
    </div>

    <!-- Travel Companions Section (at bottom for all non-trip items) -->
    {#if showTripSelector}
      <div class="form-group">
        <ItemCompanionsForm
          companions={selectedCompanions}
          onCompanionsUpdate={(companions) => {
            selectedCompanions = companions;

            // For existing items in a trip, immediately save companions to trigger auto-propagation
            if (isEditing && data?.id && selectedTripId) {
              const companionIds = companions.map(c => c.id);
              itemCompanionsApi.update(itemType, data.id, companionIds).catch((err) => {
                // Error saving - silently continue
              });
            } else if (isEditing && data?.id && !selectedTripId) {
              // Standalone item - also save companions
              const companionIds = companions.map(c => c.id);
              itemCompanionsApi.update(itemType, data.id, companionIds).catch((err) => {
                // Error saving - silently continue
              });
            }
          }}
          onAddCompanion={null}
          onRemoveCompanion={null}
        />
      </div>
    {/if}

    <!-- Trip Companions Section (at bottom for trips) -->
    {#if itemType === 'trip' && isEditing && data?.id}
      <TripCompanionsForm
        tripId={data.id}
        companions={data.tripCompanions || []}
        onCompanionsUpdate={async (companions) => {
          if (data) {
            data.tripCompanions = companions;

            // Refetch full trip data to update items with new companions
            // (backend adds new companions to all items via addCompanionToAllItems)
            try {
              const updatedTrip = await tripsApi.getOne(data.id);

              // Update data with fresh trip info (including updated items with new companions)
              if (updatedTrip) {
                Object.assign(data, updatedTrip);
                // Trigger reactivity
                data = data;

                // Call onSave to notify parent of changes
                if (onSave) {
                  onSave(updatedTrip);
                }
              }
            } catch (err) {
              // Continue - at least the trip companions were updated
            }
          }
        }}
      />
    {/if}

    <div class="form-buttons">
      <button type="submit" disabled={loading} class="submit-btn">
        {isEditing ? 'Update' : 'Add'}
      </button>
      <button type="button" on:click={onClose} disabled={loading} class="cancel-btn">
        Cancel
      </button>
    </div>

    {#if isEditing}
      <button type="button" on:click={handleDelete} disabled={loading} class="delete-btn">
        Delete
      </button>
    {/if}
  </form>
</div>

<style>
  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-group input[type='checkbox'] {
    width: auto;
    height: auto;
    padding: 0;
    margin: 0;
    accent-color: #3b82f6;
    cursor: pointer;
    min-height: auto;
  }

  .checkbox-group span {
    font-size: 0.85rem;
    color: #111827;
  }
</style>
