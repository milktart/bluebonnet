<script lang="ts">
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { settingsApi } from '$lib/services/settings';
  import { Button, FormGroup, FormRow, Input, Alert } from '$lib/components/ui';
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
    <Alert variant="error" dismissible={false}>{error}</Alert>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-fields">
      <FormRow columns={2} ratio="2fr 1fr">
        <FormGroup label="IATA Code *" id="iata">
          <Input
            id="iata"
            type="text"
            bind:value={formData.iata}
            placeholder="JFK"
            disabled={submitting || isEdit}
            required
          />
          {#if isEdit}
            <p class="help-text">IATA code cannot be changed</p>
          {/if}
        </FormGroup>

        <FormGroup label="ICAO Code" id="icao">
          <Input
            id="icao"
            type="text"
            bind:value={formData.icao}
            placeholder="KJFK"
            disabled={submitting}
          />
        </FormGroup>
      </FormRow>

      <FormGroup label="Airport Name *" id="name">
        <Input
          id="name"
          type="text"
          bind:value={formData.name}
          placeholder="John F. Kennedy International Airport"
          disabled={submitting}
          required
        />
      </FormGroup>

      <FormRow columns={2}>
        <FormGroup label="City *" id="city">
          <Input
            id="city"
            type="text"
            bind:value={formData.city}
            placeholder="New York"
            disabled={submitting}
            required
          />
        </FormGroup>

        <FormGroup label="Country *" id="country">
          <Input
            id="country"
            type="text"
            bind:value={formData.country}
            placeholder="United States"
            disabled={submitting}
            required
          />
        </FormGroup>
      </FormRow>

      <FormRow columns={2}>
        <FormGroup label="Latitude" id="latitude">
          <Input
            id="latitude"
            type="text"
            bind:value={formData.latitude}
            placeholder="40.6413"
            disabled={submitting}
          />
        </FormGroup>

        <FormGroup label="Longitude" id="longitude">
          <Input
            id="longitude"
            type="text"
            bind:value={formData.longitude}
            placeholder="-73.7781"
            disabled={submitting}
          />
        </FormGroup>
      </FormRow>

      <FormGroup label="Timezone" id="timezone">
        <Input
          id="timezone"
          type="text"
          bind:value={formData.timezone}
          placeholder="America/New_York"
          disabled={submitting}
        />
      </FormGroup>
    </div>

    <div class="form-buttons">
      <Button type="submit" variant="primary" disabled={submitting} loading={submitting}>
        Update Airport
      </Button>
      <Button type="button" variant="secondary" on:click={handleCancel} disabled={submitting}>
        Cancel
      </Button>
    </div>
  </form>
</div>

<style>
  .help-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }
</style>
