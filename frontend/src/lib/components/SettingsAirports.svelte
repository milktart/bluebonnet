<script lang="ts">
  import { onMount } from 'svelte';
  import Alert from './Alert.svelte';
  import { dashboardStoreActions } from '$lib/stores/dashboardStore';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  interface Airport {
    iata: string;
    icao: string;
    name: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }

  let airports: Airport[] = [];
  let loading = true;
  let error: string | null = null;
  let successMessage: string | null = null;
  let sortColumn: keyof Airport = 'iata';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let filters = {
    iata: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    timezone: '',
  };

  function handleSort(column: keyof Airport) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  function getFilteredAndSortedAirports() {
    // Filter
    let filtered = airports.filter((airport) => {
      return (
        (!filters.iata || airport.iata.toLowerCase().includes(filters.iata.toLowerCase())) &&
        (!filters.name || airport.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.city || airport.city.toLowerCase().includes(filters.city.toLowerCase())) &&
        (!filters.country || airport.country.toLowerCase().includes(filters.country.toLowerCase())) &&
        (!filters.latitude || String(airport.latitude || '').includes(filters.latitude)) &&
        (!filters.longitude || String(airport.longitude || '').includes(filters.longitude)) &&
        (!filters.timezone || (airport.timezone || '').toLowerCase().includes(filters.timezone.toLowerCase()))
      );
    });

    // Sort
    return filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onMount(async () => {
    await loadAirports();

    // Listen for airport update events
    window.addEventListener('airports-updated', handleAirportsUpdated);

    return () => {
      window.removeEventListener('airports-updated', handleAirportsUpdated);
    };
  });

  async function loadAirports() {
    try {
      loading = true;
      error = null;
      const response = await settingsApi.getAllAirports();
      airports = (response.airports || []).map((airport: any) => ({
        ...airport,
        latitude: airport.latitude ? parseFloat(airport.latitude) : null,
        longitude: airport.longitude ? parseFloat(airport.longitude) : null,
      }));
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load airports';
      console.error('Error loading airports:', err);
    } finally {
      loading = false;
    }
  }

  function handleAirportsUpdated() {
    loadAirports();
  }

  function handleEditAirport(airport: Airport) {
    dashboardStoreActions.openTertiarySidebar({
      type: 'edit-airport',
      data: { airport },
    });
  }
</script>

<div class="settings-airports-container">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if successMessage}
    <Alert type="success" message={successMessage} dismissible />
  {/if}

  {#if loading}
    <div class="loading-state">
      <span class="material-symbols-outlined">hourglass_empty</span>
      <p>Loading airports...</p>
    </div>
  {:else if airports && airports.length > 0}
    <div class="table-wrapper">
      <table class="airports-table">
        <thead>
          <tr>
            <th class="sortable" on:click={() => handleSort('iata')}>
              IATA
              {#if sortColumn === 'iata'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('name')}>
              Name
              {#if sortColumn === 'name'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('city')}>
              City
              {#if sortColumn === 'city'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('country')}>
              Country
              {#if sortColumn === 'country'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('latitude')}>
              Latitude
              {#if sortColumn === 'latitude'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('longitude')}>
              Longitude
              {#if sortColumn === 'longitude'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('timezone')}>
              Timezone
              {#if sortColumn === 'timezone'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="actions-col"></th>
          </tr>
          <tr class="filter-row">
            <td><input type="text" placeholder="Filter..." bind:value={filters.iata} class="filter-input" /></td>
            <td><input type="text" placeholder="Filter..." bind:value={filters.name} class="filter-input" /></td>
            <td><input type="text" placeholder="Filter..." bind:value={filters.city} class="filter-input" /></td>
            <td><input type="text" placeholder="Filter..." bind:value={filters.country} class="filter-input" /></td>
            <td><input type="text" placeholder="Filter..." bind:value={filters.latitude} class="filter-input" /></td>
            <td><input type="text" placeholder="Filter..." bind:value={filters.longitude} class="filter-input" /></td>
            <td><input type="text" placeholder="Filter..." bind:value={filters.timezone} class="filter-input" /></td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {#each getFilteredAndSortedAirports() as airport (airport.iata)}
            <tr>
              <td class="iata-cell">{airport.iata}</td>
              <td class="name-cell">{airport.name}</td>
              <td class="city-cell">{airport.city}</td>
              <td class="country-cell">{airport.country}</td>
              <td class="coordinate-cell">{airport.latitude ? parseFloat(airport.latitude).toFixed(4) : '-'}</td>
              <td class="coordinate-cell">{airport.longitude ? parseFloat(airport.longitude).toFixed(4) : '-'}</td>
              <td class="timezone-cell">{airport.timezone || '-'}</td>
              <td class="actions-cell">
                <button
                  class="action-btn edit-btn"
                  title="Edit airport"
                  on:click={() => handleEditAirport(airport)}
                  disabled={loading}
                >
                  <span class="material-symbols-outlined">edit</span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">
      <span class="material-symbols-outlined">flight_land</span>
      <p>No airports found</p>
      <p class="empty-description">
        The airport database is currently empty. Run the seed command to import airports.
      </p>
    </div>
  {/if}
</div>

<style>
  .settings-airports-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
  }

  .loading-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
  }

  .airports-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    font-size: 0.75rem;
  }

  .airports-table thead {
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }

  .airports-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    vertical-align: middle;
  }

  .airports-table th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s;
  }

  .airports-table th.sortable:hover {
    background-color: #ececec;
  }

  .sort-indicator {
    display: inline-block;
    margin-left: 0.375rem;
    font-size: 0.65rem;
    line-height: 1;
  }

  .filter-row {
    background-color: #fafafa;
    border-bottom: 1px solid #e0e0e0;
  }

  .filter-row td {
    padding: 0.5rem;
    vertical-align: middle;
  }

  .filter-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.3rem;
    font-size: 0.75rem;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .filter-input::placeholder {
    color: #d1d5db;
  }

  .filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .airports-table td {
    padding: 0.875rem;
    border-bottom: 1px solid var(--color-border-light);
    color: #1f2937;
    vertical-align: middle;
  }

  .airports-table tbody tr:hover {
    background-color: #fafafa;
  }

  .airports-table tbody tr:last-child td {
    border-bottom: none;
  }

  .iata-cell {
    font-weight: 600;
    color: #1976d2;
    font-family: 'Courier New', monospace;
    width: 70px;
  }

  .name-cell {
    font-weight: 500;
    color: #1f2937;
  }

  .city-cell {
    color: #6b7280;
  }

  .country-cell {
    color: #6b7280;
  }

  .coordinate-cell {
    font-family: 'Courier New', monospace;
    color: #6b7280;
    font-size: 0.7rem;
    width: 90px;
  }

  .timezone-cell {
    color: #6b7280;
    font-size: 0.7rem;
  }

  .actions-col {
    width: 60px;
    text-align: center;
  }

  .actions-cell {
    text-align: center;
    padding: 0.875rem 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    line-height: 1;
    vertical-align: top;
  }

  .action-btn :global(.material-symbols-outlined) {
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .edit-btn:hover:not(:disabled) {
    background-color: #bbdefb;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
    background: #fafafa;
    border-radius: 8px;
  }

  .empty-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-description {
    font-size: 0.85rem;
    color: #999;
  }
</style>
