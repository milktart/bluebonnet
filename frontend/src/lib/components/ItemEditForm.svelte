<script lang="ts">
  import { tripsApi, flightsApi, hotelsApi, eventsApi, transportationApi, carRentalsApi, itemCompanionsApi } from '$lib/services/api';
  import { tripStore } from '$lib/stores/tripStore';
  import { authStore } from '$lib/stores/authStore';
  import { dataService } from '$lib/services/dataService';
  import { utcToLocalTimeString } from '$lib/utils/timezoneUtils';
  import { getFormConfigs } from '$lib/utils/formConfigs';
  import { getTripEndDate, parseLocalDate } from '$lib/utils/dashboardGrouping';
  import type { ItemType, Trip, TravelItem, FormData } from '$lib/types';
  import AirportAutocomplete from './AirportAutocomplete.svelte';
  import ItemCompanionsForm from './ItemCompanionsForm.svelte';
  import TripCompanionsForm from './TripCompanionsForm.svelte';
  import { Button } from '$lib/components/ui';
  import '$lib/styles/form-styles.css';

  export let itemType: ItemType;
  export let data: TravelItem | Trip | null = null;
  export let tripId: string = '';
  export let allTrips: Trip[] = [];
  export let onClose: () => void = () => {};
  export let onSave: (updatedItem: TravelItem | Trip) => void = () => {};
  export let isMobile: boolean = false;
  export let containerType: 'modal' | 'sidebar' = 'sidebar';
  export let canEdit: boolean = true;

  let loading = false;
  let error: string | null = null;

  // Re-compute isEditing reactively based on data
  $: isEditing = !!data?.id;


  // Show trip selector only for non-trip items (not for trip itself)
  $: showTripSelector = itemType !== 'trip';

  // Filter trips to show only upcoming/in-progress (exclude past trips)
  $: upcomingTrips = allTrips.filter((trip) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = getTripEndDate(trip);
    return endDate >= now;
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
      // Use hotel's check-in timezone for check-in, check-out timezone for check-out
      const checkInStr = utcToLocalTimeString(sourceData.checkInDateTime, sourceData.checkInTimezone);
      if (checkInStr) {
        const [date, time] = checkInStr.split('T');
        formData.checkInDate = date;
        formData.checkInTime = time;
      }

      if (sourceData.checkOutDateTime) {
        const checkOutStr = utcToLocalTimeString(sourceData.checkOutDateTime, sourceData.checkOutTimezone);
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

    // Convert isConfirmed to isTentative for frontend display
    // isTentative = !isConfirmed (checked = tentative, unchecked = confirmed)
    if (sourceData.isConfirmed !== undefined) {
      formData.isTentative = !sourceData.isConfirmed;
      // Remove isConfirmed from formData since we're using isTentative
      delete formData.isConfirmed;
    }

    return formData;
  }

  let formData: FormData = initializeFormData(data);
  let airlineLookupLoading = false;
  let selectedTripId: string = '';
  let selectedCompanions: Array<{ id: string; name: string }> = [];
  let fetchedItemId: string | null = null;
  let freshItemData: any = null;

  // Fetch fresh item data from the canonical GET /:id endpoint.
  // This ensures companion data always comes from a single code path (itemCompanionLoader)
  // regardless of how the edit form was opened (dashboard click vs URL navigation).
  async function fetchFreshItemData(id: string, type: ItemType): Promise<any> {
    try {
      if (type === 'flight') return await flightsApi.getById(id);
      if (type === 'hotel') return await hotelsApi.getById(id);
      if (type === 'event') return await eventsApi.getById(id);
      if (type === 'transportation') return await transportationApi.getById(id);
      if (type === 'carRental') return await carRentalsApi.getById(id);
    } catch {
      return null;
    }
    return null;
  }

  function initializeFromItemData(itemData: any) {
    const initialized = initializeFormData(itemData);
    formData = initialized;
    selectedTripId = itemData?.tripId || '';

    // Companions come from the canonical GET /:id endpoint which provides
    // properly structured itemCompanions and tripCompanions
    const itemComps = itemData?.itemCompanions || [];
    const tripComps = itemData?.tripCompanions || [];

    // Combine both lists, avoiding duplicates
    // Use userId as primary dedup key when available (handles owner appearing in both lists)
    const seenIdentifiers = new Set<string>();
    const processedComps: any[] = [];

    for (const comp of [...itemComps, ...tripComps]) {
      const userIdKey = comp.userId ? `user:${comp.userId}` : null;
      const companionKey = comp.companionId || comp.id;

      if (userIdKey && !seenIdentifiers.has(userIdKey)) {
        seenIdentifiers.add(userIdKey);
        if (companionKey) seenIdentifiers.add(String(companionKey));
        processedComps.push(comp);
      } else if (!userIdKey && companionKey && !seenIdentifiers.has(String(companionKey))) {
        seenIdentifiers.add(String(companionKey));
        processedComps.push(comp);
      }
    }

    selectedCompanions = processedComps;
  }

  // Re-initialize formData and selectedTripId when data or itemType changes.
  // For existing non-trip items, always fetch fresh data from the GET /:id endpoint
  // so companion data comes from a single canonical code path.
  $: if (data) {
    if (data.id && itemType !== 'trip' && fetchedItemId !== data.id) {
      // Mark as fetching to avoid duplicate requests
      fetchedItemId = data.id;
      freshItemData = null;
      // Initialize form fields immediately for responsiveness, but NOT companions
      const initialized = initializeFormData(data);
      formData = initialized;
      selectedTripId = data?.tripId || '';
      // Fetch fresh data — companions will ONLY come from this canonical endpoint
      fetchFreshItemData(data.id, itemType).then((fetched) => {
        if (fetched) {
          freshItemData = fetched;
          initializeFromItemData(fetched);
        }
      });
    } else if (data.id && itemType !== 'trip' && freshItemData) {
      // Already fetched fresh data for this item — use it instead of stale store data
      // (This branch runs when the reactive block re-fires from store updates)
      initializeFromItemData(freshItemData);
    } else {
      initializeFromItemData(data);
    }
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

  // Auto-sync dates: when start/departure date changes, set end/arrival to the same date
  function handleStartDateChange(fieldName: string, endFieldName: string) {
    if (formData[fieldName as keyof typeof formData]) {
      formData = { ...formData, [endFieldName]: formData[fieldName as keyof typeof formData] };
    }
  }

  // Auto-sync dates: when end/arrival date changes, check if it's before start/departure date
  function handleEndDateChange(fieldName: string, startFieldName: string) {
    const endDate = formData[fieldName as keyof typeof formData];
    const startDate = formData[startFieldName as keyof typeof formData];

    if (endDate && (!startDate || endDate < startDate)) {
      formData = { ...formData, [startFieldName]: endDate };
    }
  }

  // Re-compute config reactively based on isEditing and itemType
  $: config = getFormConfigs(isEditing)[itemType] || { title: '', fields: [] };

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      let result;
      // Use selectedTripId if it was changed, otherwise use the original tripId
      const effectiveTripId = selectedTripId || tripId;

      // Prepare form data with tripId for non-trip items
      const submitData = { ...formData };

      // Convert isTentative back to isConfirmed for backend
      // isConfirmed = !isTentative (unchecked = confirmed, checked = tentative)
      if (submitData.isTentative !== undefined) {
        submitData.isConfirmed = !submitData.isTentative;
        delete submitData.isTentative;
      }

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
          result = await tripsApi.update(data.id, submitData);
        } else {
          result = await tripsApi.create(submitData);
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
          // Filter to only include actual companion records (exclude owner if they don't have a companionId)
          // The owner (userId === currentUser.id and no companionId) should not be saved as a companion
          const currentUserId = $authStore.user?.id;
          const companionIds = selectedCompanions
            .filter(c => {
              // Exclude the owner if they don't have a companionId (not a TravelCompanion record)
              if (c.userId === currentUserId && !c.companionId && c.isOwner) {
                return false;
              }
              return true;
            })
            .map(c => c.companionId || c.id)
            .filter(id => id && !String(id).startsWith('virtual-companion-'));

          if (companionIds.length > 0) {
            await itemCompanionsApi.update(itemType, result.id, companionIds);
          }

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

{#if containerType === 'modal'}
  <div class="form-modal-overlay" on:click={onClose} role="presentation" />
{/if}

<div class="edit-panel" class:modal-container={containerType === 'modal'}>
  {#if containerType === 'modal'}
    <div class="modal-header">
      <h2 class="modal-title">
        {#if itemType === 'trip'}
          {data?.id ? 'Edit Trip' : 'New Trip'}
        {:else if itemType === 'flight'}
          {data?.id ? 'Edit Flight' : 'New Flight'}
        {:else if itemType === 'hotel'}
          {data?.id ? 'Edit Hotel' : 'New Hotel'}
        {:else if itemType === 'transportation'}
          {data?.id ? 'Edit Transportation' : 'New Transportation'}
        {:else if itemType === 'carRental'}
          {data?.id ? 'Edit Car Rental' : 'New Car Rental'}
        {:else if itemType === 'event'}
          {data?.id ? 'Edit Event' : 'New Event'}
        {/if}
      </h2>
      <button class="modal-close-button" on:click={onClose} aria-label="Close form">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  {:else}
    <div class="edit-header">
      <div class="header-left">
        <button class="back-btn" on:click={onClose}>
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="header-title-wrapper">
          <h3>{config.title}</h3>
        </div>
      </div>
      <div class="icon-badge" data-type={itemType}>
        <span class="material-symbols-outlined">{getItemIcon(itemType)}</span>
      </div>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="edit-content">
    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <div class="form-fields">
      {#if showTripSelector}
        <!-- Trip Selector & Tentative (3-col: 2-1) -->
        <div class="form-row cols-3">
          <div class="form-group" style="grid-column: span 2;">
            <label for="tripSelector">Trip</label>
            <select id="tripSelector" bind:value={selectedTripId} disabled={!canEdit}>
              <option value="">Standalone Item</option>
              {#each upcomingTrips as trip (trip.id)}
                <option value={trip.id}>{trip.name}</option>
              {/each}
            </select>
          </div>
          {#if config?.fields?.some(f => f.name === 'isTentative')}
            <div class="form-group" style="display: flex; flex-direction: column; align-items: center;">
              <label for="isTentative" style="text-align: center;">Tentative</label>
              <div class="checkbox-group" style="display: flex; justify-content: center; align-items: center; flex: 1;">
                <label for="isTentative">
                  <input type="checkbox" id="isTentative" name="isTentative" checked={formData.isTentative} on:change={(e) => formData.isTentative = e.target.checked} disabled={!canEdit} />
                </label>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      {#if itemType === 'flight'}
        <!-- Flight Number & Airline (3-col: 1-2) -->
        <div class="form-row cols-3">
          <div class="form-group">
            <label for="flightNumber">{config?.fields?.find(f => f.name === 'flightNumber')?.label}</label>
            <input
              type="text"
              id="flightNumber"
              name="flightNumber"
              bind:value={formData.flightNumber}
              on:blur={handleFlightNumberChange}
              placeholder="KL668"
              disabled={!canEdit}
            />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label for="airline">
              {config?.fields?.find(f => f.name === 'airline')?.label}
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
              disabled={!canEdit}
              onSelect={(airport) => {
                formData.origin = airport.iata;
                if (airport.timezone) {
                  formData.originTimezone = airport.timezone;
                }
              }}
            />
          </div>
          <div class="form-group">
            <label for="destination">Destination</label>
            <AirportAutocomplete
              id="destination"
              bind:value={formData.destination}
              placeholder="AMS"
              disabled={!canEdit}
              onSelect={(airport) => {
                formData.destination = airport.iata;
                if (airport.timezone) {
                  formData.destinationTimezone = airport.timezone;
                }
              }}
            />
          </div>
        </div>

        <!-- Departure & Arrival Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureDate">Departure Date</label>
            <input type="date" id="departureDate" name="departureDate" bind:value={formData.departureDate} on:change={() => handleStartDateChange('departureDate', 'arrivalDate')} disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="arrivalDate">Arrival Date</label>
            <input type="date" id="arrivalDate" name="arrivalDate" bind:value={formData.arrivalDate} on:change={() => handleEndDateChange('arrivalDate', 'departureDate')} disabled={!canEdit} />
          </div>
        </div>

        <!-- Departure & Arrival Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureTime">Departure Time</label>
            <input type="text" id="departureTime" name="departureTime" bind:value={formData.departureTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="arrivalTime">Arrival Time</label>
            <input type="text" id="arrivalTime" name="arrivalTime" bind:value={formData.arrivalTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
        </div>

        <!-- PNR & Seat (3-col: 2-1) -->
        <div class="form-row cols-3">
          <div class="form-group" style="grid-column: span 2;">
            <label for="pnr">PNR</label>
            <input type="text" id="pnr" name="pnr" bind:value={formData.pnr} placeholder="ABC123D" disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="seat">Seat</label>
            <input type="text" id="seat" name="seat" bind:value={formData.seat} placeholder="4A" disabled={!canEdit} />
          </div>
        </div>
      {:else if itemType === 'hotel'}
        <!-- Hotel Name (full-width) -->
        <div class="form-group">
          <label for="name">Hotel Name</label>
          <input type="text" id="name" name="name" bind:value={formData.name} placeholder="W Bangkok" required disabled={!canEdit} />
        </div>

        <!-- Address (full-width) -->
        <div class="form-group">
          <label for="address">Address</label>
          <textarea id="address" name="address" bind:value={formData.address} placeholder="Full address" disabled={!canEdit} />
        </div>

        <!-- Check-in & Check-out Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="checkInDate">Check-in Date</label>
            <input type="date" id="checkInDate" name="checkInDate" bind:value={formData.checkInDate} on:change={() => handleStartDateChange('checkInDate', 'checkOutDate')} required disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="checkOutDate">Check-out Date</label>
            <input type="date" id="checkOutDate" name="checkOutDate" bind:value={formData.checkOutDate} on:change={() => handleEndDateChange('checkOutDate', 'checkInDate')} required disabled={!canEdit} />
          </div>
        </div>

        <!-- Check-in & Check-out Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="checkInTime">Check-in Time</label>
            <input type="text" id="checkInTime" name="checkInTime" bind:value={formData.checkInTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="checkOutTime">Check-out Time</label>
            <input type="text" id="checkOutTime" name="checkOutTime" bind:value={formData.checkOutTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
        </div>

        <!-- Confirmation Number (full-width) -->
        <div class="form-group">
          <label for="confirmationNumber">Confirmation Number</label>
          <input type="text" id="confirmationNumber" name="confirmationNumber" bind:value={formData.confirmationNumber} disabled={!canEdit} />
        </div>

        <!-- Notes (full-width) -->
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} placeholder="Additional information" disabled={!canEdit} />
        </div>
      {:else if itemType === 'transportation'}
        <!-- Method (full-width) -->
        <div class="form-group">
          <label for="method">Method</label>
          <select id="method" name="method" bind:value={formData.method} required disabled={!canEdit}>
            <option value="">Select Method</option>
            {#each config?.fields?.find(f => f.name === 'method')?.options || [] as option}
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
            <input type="text" id="origin" name="origin" bind:value={formData.origin} required disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="destination">To</label>
            <input type="text" id="destination" name="destination" bind:value={formData.destination} required disabled={!canEdit} />
          </div>
        </div>

        <!-- Departure & Arrival Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureDate">Departure Date</label>
            <input type="date" id="departureDate" name="departureDate" bind:value={formData.departureDate} on:change={() => handleStartDateChange('departureDate', 'arrivalDate')} required disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="arrivalDate">Arrival Date</label>
            <input type="date" id="arrivalDate" name="arrivalDate" bind:value={formData.arrivalDate} on:change={() => handleEndDateChange('arrivalDate', 'departureDate')} required disabled={!canEdit} />
          </div>
        </div>

        <!-- Departure & Arrival Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureTime">Departure Time</label>
            <input type="text" id="departureTime" name="departureTime" bind:value={formData.departureTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="arrivalTime">Arrival Time</label>
            <input type="text" id="arrivalTime" name="arrivalTime" bind:value={formData.arrivalTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
        </div>

        <!-- Booking Reference & Notes -->
        <div class="form-group">
          <label for="bookingReference">Booking Reference</label>
          <input type="text" id="bookingReference" name="bookingReference" bind:value={formData.bookingReference} disabled={!canEdit} />
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} placeholder="Additional information" disabled={!canEdit} />
        </div>

      {:else if itemType === 'carRental'}
        <!-- Company & Pickup Location (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="company">Company</label>
            <input type="text" id="company" name="company" bind:value={formData.company} required disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="pickupLocation">Pickup Location</label>
            <input type="text" id="pickupLocation" name="pickupLocation" bind:value={formData.pickupLocation} required disabled={!canEdit} />
          </div>
        </div>

        <!-- Pickup & Dropoff Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="pickupDate">Pickup Date</label>
            <input type="date" id="pickupDate" name="pickupDate" bind:value={formData.pickupDate} on:change={() => handleStartDateChange('pickupDate', 'dropoffDate')} required disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="dropoffDate">Dropoff Date</label>
            <input type="date" id="dropoffDate" name="dropoffDate" bind:value={formData.dropoffDate} on:change={() => handleEndDateChange('dropoffDate', 'pickupDate')} required disabled={!canEdit} />
          </div>
        </div>

        <!-- Pickup & Dropoff Times (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="pickupTime">Pickup Time</label>
            <input type="text" id="pickupTime" name="pickupTime" bind:value={formData.pickupTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="dropoffTime">Dropoff Time</label>
            <input type="text" id="dropoffTime" name="dropoffTime" bind:value={formData.dropoffTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
          </div>
        </div>

        <!-- Dropoff Location -->
        <div class="form-group">
          <label for="dropoffLocation">Dropoff Location</label>
          <input type="text" id="dropoffLocation" name="dropoffLocation" bind:value={formData.dropoffLocation} required disabled={!canEdit} />
        </div>

        <!-- Confirmation & Notes -->
        <div class="form-group">
          <label for="confirmationNumber">Confirmation Number</label>
          <input type="text" id="confirmationNumber" name="confirmationNumber" bind:value={formData.confirmationNumber} disabled={!canEdit} />
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} placeholder="Additional information" disabled={!canEdit} />
        </div>

      {:else if itemType === 'event'}
        <!-- Event Name & Location (full-width) -->
        <div class="form-group">
          <label for="name">Event Name</label>
          <input type="text" id="name" name="name" bind:value={formData.name} required disabled={!canEdit} />
        </div>

        <div class="form-group">
          <label for="location">Location</label>
          <textarea id="location" name="location" bind:value={formData.location} required disabled={!canEdit}></textarea>
        </div>

        <!-- All Day Checkbox -->
        <div class="form-group checkbox-group">
          <label for="allDay">
            <input type="checkbox" id="allDay" name="allDay" bind:checked={formData.allDay} disabled={!canEdit} />
            <span>All Day Event</span>
          </label>
        </div>

        {#if formData.allDay}
          <!-- All Day: Start & End Dates only (2-col) -->
          <div class="form-row cols-2">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" bind:value={formData.startDate} on:change={() => handleStartDateChange('startDate', 'endDate')} required disabled={!canEdit} />
            </div>
            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" id="endDate" name="endDate" bind:value={formData.endDate} on:change={() => handleEndDateChange('endDate', 'startDate')} disabled={!canEdit} />
            </div>
          </div>
        {:else}
          <!-- Start & End Dates (2-col) -->
          <div class="form-row cols-2">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" bind:value={formData.startDate} on:change={() => handleStartDateChange('startDate', 'endDate')} required disabled={!canEdit} />
            </div>
            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" id="endDate" name="endDate" bind:value={formData.endDate} on:change={() => handleEndDateChange('endDate', 'startDate')} disabled={!canEdit} />
            </div>
          </div>

          <!-- Start & End Times (2-col) -->
          <div class="form-row cols-2">
            <div class="form-group">
              <label for="startTime">Start Time</label>
              <input type="text" id="startTime" name="startTime" bind:value={formData.startTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
            </div>
            <div class="form-group">
              <label for="endTime">End Time</label>
              <input type="text" id="endTime" name="endTime" bind:value={formData.endTime} placeholder="HH:MM" maxlength="5" on:keyup={formatTimeInput} disabled={!canEdit} />
            </div>
          </div>
        {/if}

        <!-- Ticket Number -->
        <div class="form-group">
          <label for="ticketNumber">Ticket Number</label>
          <input type="text" id="ticketNumber" name="ticketNumber" bind:value={formData.ticketNumber} disabled={!canEdit} />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" bind:value={formData.description} placeholder="Event details" disabled={!canEdit} />
        </div>

      {:else if itemType === 'trip'}
        <!-- Trip Name & Tentative (3-col: 2-1) -->
        <div class="form-row cols-3">
          <div class="form-group" style="grid-column: span 2;">
            <label for="name">Trip Name</label>
            <input type="text" id="name" name="name" bind:value={formData.name} placeholder="Summer Vacation" required disabled={!canEdit} />
          </div>
          <div class="form-group" style="display: flex; flex-direction: column; align-items: center;">
            <label for="isTentative" style="text-align: center;">Tentative</label>
            <div class="checkbox-group" style="display: flex; justify-content: center; align-items: center; flex: 1;">
              <label for="isTentative">
                <input type="checkbox" id="isTentative" name="isTentative" checked={formData.isTentative} on:change={(e) => formData.isTentative = e.target.checked} disabled={!canEdit} />
              </label>
            </div>
          </div>
        </div>

        <!-- Purpose (full-width) -->
        <div class="form-group">
          <label for="purpose">Purpose</label>
          <select id="purpose" name="purpose" bind:value={formData.purpose} required disabled={!canEdit}>
            <option value="">Select Purpose</option>
            <option value="leisure">Leisure</option>
            <option value="business">Business</option>
            <option value="family">Family</option>
            <option value="romantic">Romantic</option>
            <option value="adventure">Adventure</option>
          </select>
        </div>

        <!-- Departure & Return Dates (2-col) -->
        <div class="form-row cols-2">
          <div class="form-group">
            <label for="departureDate">Departure Date</label>
            <input type="date" id="departureDate" name="departureDate" bind:value={formData.departureDate} required disabled={!canEdit} />
          </div>
          <div class="form-group">
            <label for="returnDate">Return Date</label>
            <input type="date" id="returnDate" name="returnDate" bind:value={formData.returnDate} required disabled={!canEdit} />
          </div>
        </div>

        <!-- Notes (full-width) -->
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes" bind:value={formData.notes} disabled={!canEdit} />
        </div>
      {/if}
    </div>

    <!-- Travel Companions Section (at bottom for all non-trip items) -->
    {#if showTripSelector}
      <div class="form-group">
        <ItemCompanionsForm
          itemId={data?.id || ''}
          tripId={data?.tripId || null}
          companions={selectedCompanions}
          canEdit={canEdit}
          currentUserId={$authStore.user?.id || null}
          itemOwnerId={data?.userId || null}
          tripOwnerId={allTrips.find(t => t.id === data?.tripId)?.userId || data?.tripOwnerId || null}
          isStandaloneItem={!data?.tripId}
          onCompanionsUpdate={(companions) => {
            selectedCompanions = companions;

            // For existing items in a trip, immediately save companions to trigger auto-propagation
            if (isEditing && data?.id && selectedTripId) {
              const tripOwnerId = allTrips.find(t => t.id === selectedTripId)?.userId;
              const companionIds = companions
                .filter(c => {
                  // Only include companions with a companionId (valid TravelCompanion records)
                  // Exclude the item owner (they don't need to be in the companion list)
                  return c.companionId;
                })
                .map(c => c.companionId)
                .filter(Boolean);

              itemCompanionsApi.update(itemType, data.id, companionIds).catch((err) => {
                console.error('[ItemEditForm] Error saving companions:', err);
                // Error saving - silently continue
              });
            } else if (isEditing && data?.id && !selectedTripId) {
              // Standalone item - also save companions
              const itemOwnerId = data.userId;
              const companionIds = companions
                .filter(c => {
                  // Always exclude the item owner - they don't need a companion record
                  const companionUserId = c.userId || c.id;
                  return companionUserId !== itemOwnerId && c.companionId;
                })
                .map(c => c.companionId)
                .filter(Boolean);

              itemCompanionsApi.update(itemType, data.id, companionIds).catch((err) => {
                console.error('[ItemEditForm] Error saving companions:', err);
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
        tripOwnerId={data.userId}
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

    {#if canEdit}
      <div class="form-buttons">
        <Button type="submit" variant="primary" disabled={loading} fullWidth>
          {isEditing ? 'Update' : 'Add'}
        </Button>
        <Button type="button" variant="secondary" on:click={onClose} disabled={loading} fullWidth>
          Cancel
        </Button>
      </div>

      {#if isEditing}
        <Button type="button" variant="danger" on:click={handleDelete} disabled={loading} fullWidth>
          Delete
        </Button>
      {/if}
    {:else}
      <div class="form-buttons">
        <Button type="button" variant="secondary" on:click={onClose} fullWidth>
          Close
        </Button>
      </div>
    {/if}
  </form>
</div>

<style>
  /* Modal container styles */
  .form-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 40;
    animation: fadeIn 0.3s ease-out;
    display: none;
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

  /* Show modal on mobile */
  @media (max-width: 639px) {
    .form-modal-overlay {
      display: block;
    }

    .edit-panel.modal-container {
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
      max-width: 100%;
    }
  }

  /* Hide modal on desktop */
  @media (min-width: 640px) {
    .form-modal-overlay {
      display: none !important;
    }

    .edit-panel.modal-container {
      display: none !important;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-light);
    flex-shrink: 0;
  }

  .modal-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    min-width: 44px;
    min-height: 44px;
  }

  .modal-close-button:active {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .modal-close-button :global(.material-symbols-outlined) {
    font-size: 1.5rem;
  }

  /* Modal content scrolling */
  @media (max-width: 639px) {
    .edit-panel.modal-container .edit-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
  }

  /* Landscape mode - reduce max height */
  @media (max-height: 600px) {
    .edit-panel.modal-container {
      max-height: 95vh;
    }
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0;
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    position: relative;
    z-index: 10;
  }

  .checkbox-group input[type='checkbox'] {
    width: 1.2rem;
    height: 1.2rem;
    padding: 0;
    margin: 0;
    accent-color: var(--color-primary);
    cursor: pointer;
    -webkit-appearance: checkbox;
    appearance: checkbox;
  }

  .checkbox-group span {
    font-size: var(--text-base);
    color: var(--color-text-primary);
  }

  .header-title-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-title-wrapper h3 {
    margin: 0;
  }

  .read-only-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--text-2xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .read-only-badge :global(.material-symbols-outlined) {
    font-size: 0.75rem;
    font-weight: 500;
  }
</style>
