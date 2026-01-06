<script lang="ts">
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  interface Airport {
    iata: string;
    icao?: string;
    name: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  }

  export let airport: Airport | null = null;

  let formData = {
    iata: airport?.iata || '',
    icao: airport?.icao || '',
    name: airport?.name || '',
    city: airport?.city || '',
    country: airport?.country || '',
    latitude: airport?.latitude || '',
    longitude: airport?.longitude || '',
    timezone: airport?.timezone || '',
  };

  let submitting = false;
  let error: string | null = null;

  const isEdit = !!airport?.iata;

  async function handleSubmit() {
    error = null;

    // Validation
    if (!formData.iata) {
      error = 'IATA code is required';
      return;
    }

    if (formData.iata.length !== 3) {
      error = 'IATA code must be exactly 3 characters';
      return;
    }

    if (!formData.name) {
      error = 'Airport name is required';
      return;
    }

    if (!formData.city) {
      error = 'City is required';
      return;
    }

    if (!formData.country) {
      error = 'Country is required';
      return;
    }

    submitting = true;

    try {
      if (isEdit && airport?.iata) {
        // Update existing airport
        const updateData: any = {
          icao: formData.icao || null,
          name: formData.name,
          city: formData.city,
          country: formData.country,
          latitude: formData.latitude ? parseFloat(formData.latitude as unknown as string) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude as unknown as string) : null,
          timezone: formData.timezone || null,
        };
        await settingsApi.updateAirport(airport.iata, updateData);
      }

      window.dispatchEvent(new CustomEvent('airports-updated'));
      dashboardStoreActions.closeTertiarySidebar();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save airport';
      console.error('Error saving airport:', err);
    } finally {
      submitting = false;
    }
  }

  function handleCancel() {
    dashboardStoreActions.closeTertiarySidebar();
  }
</script>

<div class="edit-content">
  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-fields">
      <div class="form-row cols-2-1">
        <div class="form-group">
          <label for="iata">IATA Code *</label>
          <input
            id="iata"
            type="text"
            bind:value={formData.iata}
            placeholder="JFK"
            maxlength="3"
            disabled={submitting || isEdit}
            required
          />
          {#if isEdit}
            <p class="help-text">IATA code cannot be changed</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="icao">ICAO Code</label>
          <input
            id="icao"
            type="text"
            bind:value={formData.icao}
            placeholder="KJFK"
            maxlength="4"
            disabled={submitting}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="name">Airport Name *</label>
        <input
          id="name"
          type="text"
          bind:value={formData.name}
          placeholder="John F. Kennedy International Airport"
          disabled={submitting}
          required
        />
      </div>

      <div class="form-row cols-2">
        <div class="form-group">
          <label for="city">City *</label>
          <input
            id="city"
            type="text"
            bind:value={formData.city}
            placeholder="New York"
            disabled={submitting}
            required
          />
        </div>

        <div class="form-group">
          <label for="country">Country *</label>
          <input
            id="country"
            type="text"
            bind:value={formData.country}
            placeholder="United States"
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div class="form-row cols-2">
        <div class="form-group">
          <label for="latitude">Latitude</label>
          <input
            id="latitude"
            type="text"
            bind:value={formData.latitude}
            placeholder="40.6413"
            disabled={submitting}
          />
        </div>

        <div class="form-group">
          <label for="longitude">Longitude</label>
          <input
            id="longitude"
            type="text"
            bind:value={formData.longitude}
            placeholder="-73.7781"
            disabled={submitting}
          />
        </div>
      </div>

      <div class="form-group">
        <label for="timezone">Timezone</label>
        <input
          id="timezone"
          type="text"
          bind:value={formData.timezone}
          placeholder="America/New_York"
          disabled={submitting}
        />
      </div>
    </div>

    <div class="form-buttons">
      <button class="submit-btn" type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Update Airport'}
      </button>
      <button class="cancel-btn" type="button" on:click={handleCancel} disabled={submitting}>
        Cancel
      </button>
    </div>
  </form>
</div>

<style>
  .help-text {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
  }
</style>
