<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './Card.svelte';

  export let tripId: string;
  export let destination: string = '';
  export let locations: Array<{ name: string; lat?: number; lng?: number }> = [];
  export let flights: any[] = [];
  export let hotels: any[] = [];
  export let height: string = '400px';

  let mapContainer: HTMLElement;
  let mapInitialized = false;

  onMount(async () => {
    // Initialize Leaflet or similar mapping library
    // For now, this is a placeholder that will be enhanced
    // In production, you'd load Leaflet or Mapbox here

    initializeMap();
  });

  function initializeMap() {
    // This would load the actual map library
    // and initialize with destinations
    mapInitialized = true;
  }

  function extractLocations(): Array<{ name: string; type: string }> {
    const allLocations: Array<{ name: string; type: string }> = [];

    // Add flight origins and destinations
    flights.forEach((flight) => {
      if (flight.origin) allLocations.push({ name: flight.origin, type: 'flight-origin' });
      if (flight.destination)
        allLocations.push({ name: flight.destination, type: 'flight-dest' });
    });

    // Add hotel locations
    hotels.forEach((hotel) => {
      if (hotel.location)
        allLocations.push({ name: hotel.location, type: 'hotel' });
    });

    // Add trip destination
    if (destination) {
      allLocations.push({ name: destination, type: 'destination' });
    }

    // Deduplicate
    return Array.from(
      new Map(allLocations.map((item) => [item.name, item])).values()
    );
  }

  const uniqueLocations = extractLocations();
</script>

<Card title="Trip Map">
  <div class="map-container" style="height: {height}">
    <div bind:this={mapContainer} class="map-inner">
      {#if mapInitialized}
        <div class="map-placeholder">
          <p>Map view would load here</p>
          <p>Destinations:</p>
          <ul>
            {#each uniqueLocations as location (location.name)}
              <li>{location.name} ({location.type})</li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="map-loading">
          <p>Loading map...</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="locations-list">
    <h4>Locations in this trip:</h4>
    {#if uniqueLocations.length > 0}
      <ul class="location-items">
        {#each uniqueLocations as location (location.name)}
          <li class="location-item">
            <span class="location-icon">
              {#if location.type === 'flight-origin' || location.type === 'flight-dest'}
                ✈️
              {:else if location.type === 'hotel'}
                🏨
              {:else if location.type === 'destination'}
                📍
              {:else}
                📍
              {/if}
            </span>
            <span class="location-name">{location.name}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="no-locations">No locations added yet</p>
    {/if}
  </div>
</Card>

<style>
  .map-container {
    width: 100%;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f5f5f5;
    margin-bottom: 1.5rem;
  }

  .map-inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .map-placeholder,
  .map-loading {
    text-align: center;
    color: #999;
    font-size: 0.9rem;
  }

  .map-placeholder p {
    margin: 0 0 0.5rem 0;
  }

  .map-placeholder ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.85rem;
  }

  .map-placeholder li {
    padding: 0.25rem 0;
  }

  .locations-list {
    border-top: 1px solid #e0e0e0;
    padding-top: 1rem;
  }

  .locations-list h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: #333;
  }

  .location-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .location-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    padding: 0.5rem;
    background-color: #f9f9f9;
    border-radius: 4px;
  }

  .location-icon {
    font-size: 1.1rem;
  }

  .location-name {
    color: #333;
  }

  .no-locations {
    color: #999;
    font-size: 0.9rem;
    margin: 0;
  }
</style>
