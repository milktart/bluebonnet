<script>
  import { onMount } from 'svelte';
  import { apiCall } from '$lib/services/api';

  export let value = '';
  export let placeholder = '';
  export let disabled = false;
  export let onSelect = (airport) => {};

  let searchResults = [];
  let showResults = false;
  let isLoading = false;
  let inputElement;
  let selectedIndex = -1;

  const debounceSearch = (() => {
    let timeout;
    return (query) => {
      clearTimeout(timeout);
      if (query.length < 2) {
        searchResults = [];
        showResults = false;
        return;
      }

      isLoading = true;
      timeout = setTimeout(async () => {
        try {
          const data = await apiCall(`/v1/airports/search?q=${encodeURIComponent(query)}&limit=10`);
          searchResults = data.airports || [];
          showResults = searchResults.length > 0;
        } catch (error) {
          console.error('Airport search error:', error);
          searchResults = [];
          showResults = false;
        } finally {
          isLoading = false;
        }
      }, 300);
    };
  })();

  function handleInput(e) {
    value = e.target.value.toUpperCase();
    selectedIndex = -1;
    debounceSearch(value);
  }

  function selectAirport(airport) {
    value = airport.iata;
    searchResults = [];
    showResults = false;
    selectedIndex = -1;
    onSelect(airport);
  }

  function handleKeyDown(e) {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectAirport(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        showResults = false;
        selectedIndex = -1;
        break;
    }
  }

  function handleBlur() {
    // Delay to allow click on results
    setTimeout(() => {
      showResults = false;
      selectedIndex = -1;
    }, 200);
  }

  onMount(() => {
    // Close results when clicking outside
    function handleClickOutside(e) {
      if (inputElement && !inputElement.contains(e.target)) {
        showResults = false;
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="autocomplete-container">
  <input
    bind:this={inputElement}
    type="text"
    bind:value
    {placeholder}
    {disabled}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:focus={() => value.length >= 2 && searchResults.length > 0 && (showResults = true)}
    on:blur={handleBlur}
    style="text-transform: uppercase;"
  />

  {#if isLoading}
    <div class="loading-indicator">
      <span class="spinner"></span> Searching...
    </div>
  {/if}

  {#if showResults && searchResults.length > 0}
    <div class="autocomplete-results">
      {#each searchResults as airport, idx (airport.iata)}
        <div
          class="result-item"
          class:selected={selectedIndex === idx}
          on:click={() => selectAirport(airport)}
          on:keydown={(e) => e.key === 'Enter' && selectAirport(airport)}
          role="option"
          aria-selected={selectedIndex === idx}
        >
          <div class="airport-code">{airport.iata}</div>
          <div class="airport-info">
            <div class="airport-name">{airport.name}</div>
            <div class="airport-location">{airport.city}, {airport.country}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .autocomplete-container {
    position: relative;
    z-index: 20;
    width: 100%;
  }

  input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    box-sizing: border-box;
    height: 2.5rem;
    display: flex;
    align-items: center;
    background: #ffffff;
    color: #111827;
    font-family: inherit;
    transition: all 0.15s;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  input:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .loading-indicator {
    position: absolute;
    top: 100%;
    left: -4px;
    right: -4px;
    padding: 0.5rem;
    background: white;
    border: 1px solid #d1d5db;
    border-top: none;
    border-radius: 0 0 0.375rem 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #6b7280;
    z-index: 20;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .autocomplete-results {
    position: absolute;
    top: 100%;
    left: -4px;
    right: -4px;
    background: white;
    border: 1px solid #d1d5db;
    border-top: none;
    border-radius: 0 0 0.375rem 0.375rem;
    max-height: 300px;
    overflow-y: auto;
    z-index: 20;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .result-item {
    padding: 0.75rem;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover,
  .result-item.selected {
    background-color: #f0f7ff;
  }

  .airport-code {
    font-weight: bold;
    color: #3b82f6;
    min-width: 40px;
    text-align: center;
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  .airport-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .airport-name {
    font-weight: 500;
    color: #1f2937;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .airport-location {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
