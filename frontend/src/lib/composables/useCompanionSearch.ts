/**
 * useCompanionSearch Composable
 * Reusable search, filter, and debounce logic for companions
 * Used by: CompanionManagement, CompanionsFormSection
 *
 * Eliminates ~80 LOC of duplicated search logic per component
 */

import { writable, derived } from 'svelte/store';
import { onMount } from 'svelte';
import { companionsApi } from '$lib/services/api';
import { searchCompanions } from '$lib/utils/companionFormatter';

interface UseCompanionSearchOptions {
  onLoad?: (companions: any[]) => void;
}

/**
 * Create a reusable companion search composable
 * @param options - Configuration options
 * @returns Object with search stores and functions
 */
export function useCompanionSearch(options: UseCompanionSearchOptions = {}) {
  // Stores
  const searchInput = writable('');
  const availableCompanions = writable<any[]>([]);
  const loadingCompanions = writable(true);
  const showResults = writable(false);
  const loading = writable(false);
  const error = writable<string | null>(null);

  // Derived stores
  const searchResults = derived([searchInput, availableCompanions], ([$searchInput, $availableCompanions]) => {
    if (!$searchInput.trim()) {
      return $availableCompanions;
    }
    return searchCompanions($availableCompanions, $searchInput);
  });

  /**
   * Load all available companions
   */
  async function loadCompanions() {
    try {
      loadingCompanions.set(true);
      const response = await companionsApi.getAll();
      const companions = Array.isArray(response) ? response : response?.data || [];
      availableCompanions.set(companions);
      options.onLoad?.(companions);
    } catch (err) {
      console.error('Failed to load companions:', err);
      error.set('Failed to load companions');
      availableCompanions.set([]);
    } finally {
      loadingCompanions.set(false);
    }
  }

  /**
   * Handle search input change with debounce
   */
  async function handleSearch(query: string) {
    searchInput.set(query);
    showResults.set(query.trim().length > 0);
  }

  /**
   * Select a result and emit event
   */
  function selectResult(companion: any, onSelect?: (companion: any) => void) {
    searchInput.set('');
    showResults.set(false);
    onSelect?.(companion);
  }

  /**
   * Clear search
   */
  function clearSearch() {
    searchInput.set('');
    showResults.set(false);
  }

  /**
   * Close results dropdown
   */
  function closeResults() {
    showResults.set(false);
  }

  // Load companions on component mount
  onMount(() => {
    loadCompanions();
  });

  return {
    // Stores
    searchInput,
    searchResults,
    availableCompanions,
    showResults,
    loading,
    error,
    loadingCompanions,

    // Functions
    loadCompanions,
    handleSearch,
    selectResult,
    clearSearch,
    closeResults
  };
}
