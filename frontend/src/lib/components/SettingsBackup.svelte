<script lang="ts">
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  let loading = false;
  let error: string | null = null;
  let successMessage: string | null = null;

  let selectedFile: File | null = null;
  let importPreview: any = null;
  let previewLoading = false;
  let selectedItems: { [key: string]: boolean } = {};
  let importLoading = false;

  async function handleExport() {
    try {
      loading = true;
      error = null;

      const blob = await settingsApi.exportData();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bluebonnet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      successMessage = 'Data exported successfully';
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to export data';
    } finally {
      loading = false;
    }
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (file.type !== 'application/json') {
      error = 'Please select a valid JSON file';
      return;
    }

    selectedFile = file;
    error = null;

    // Automatically load preview
    await handlePreviewImport(file);
  }

  async function handlePreviewImport(file?: File) {
    const fileToPreview = file || selectedFile;

    if (!fileToPreview) {
      error = 'Please select a file';
      return;
    }

    try {
      previewLoading = true;
      error = null;

      const preview = await settingsApi.previewImport(fileToPreview);
      const previewData = preview.data || preview;

      // Use the preview data directly with its flat items array
      importPreview = previewData.preview || previewData;
      selectedItems = {};

      // Auto-select all non-duplicate items by default
      if (importPreview.items && Array.isArray(importPreview.items)) {
        importPreview.items.forEach((item: any) => {
          // Select item if it's not a duplicate, or always select based on backend's default
          selectedItems[item.id] = item.selected !== false;
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to preview import';
    } finally {
      previewLoading = false;
    }
  }

  async function handleConfirmImport() {
    if (!importPreview) return;

    try {
      importLoading = true;
      error = null;

      // Get the selected item IDs
      const selectedItemIds = Object.entries(selectedItems)
        .filter(([, isSelected]) => isSelected)
        .map(([itemId]) => itemId);

      if (selectedItemIds.length === 0) {
        error = 'Please select items to import';
        return;
      }

      // Reconstruct the import data from the flattened preview format
      // The preview data has a flat items array, but the backend expects structured data
      const restructuredData = {
        trips: [],
        standaloneFlights: [],
        standaloneHotels: [],
        standaloneTransportation: [],
        standaloneCarRentals: [],
        standaloneEvents: [],
        vouchers: [],
        companions: []
      };

      // Map to track which items belong to which trips
      const tripMap: { [key: string]: any } = {};
      const selectedItemsSet = new Set(selectedItemIds);
      const mergeTargetToSourceTrip: { [key: string]: any } = {}; // Track which source trip is being merged into which target trip

      // First pass: collect all selected items
      if (importPreview.items && Array.isArray(importPreview.items)) {
        for (const item of importPreview.items) {
          if (!selectedItemsSet.has(item.id)) continue; // Skip unselected items

          if (item.type === 'trip') {
            // Initialize trip structure with data from the preview
            tripMap[item.originalId] = {
              ...item.data,
              flights: [],
              hotels: [],
              transportation: [],
              carRentals: [],
              events: []
            };
            restructuredData.trips.push(tripMap[item.originalId]);
          } else if (item.type === 'flight') {
            if (item.mergeIntoExistingTrip) {
              // Track the source trip for this merge to add companions later
              if (!mergeTargetToSourceTrip[item.mergeIntoExistingTrip]) {
                const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
                if (parentItem?.data?.tripCompanions) {
                  mergeTargetToSourceTrip[item.mergeIntoExistingTrip] = parentItem.data;
                }
              }
              // Item should be added to an existing trip
              restructuredData.standaloneFlights.push({
                ...item.data,
                tripId: item.mergeIntoExistingTrip
              });
            } else if (item.parentTripId) {
              // Find the parent trip and add this flight to it
              const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
              if (parentItem && tripMap[parentItem.originalId]) {
                tripMap[parentItem.originalId].flights.push(item.data);
              } else {
                // Parent trip was not selected, treat this as a standalone flight
                restructuredData.standaloneFlights.push(item.data);
              }
            } else {
              restructuredData.standaloneFlights.push(item.data);
            }
          } else if (item.type === 'hotel') {
            if (item.mergeIntoExistingTrip) {
              // Track the source trip for this merge to add companions later
              if (!mergeTargetToSourceTrip[item.mergeIntoExistingTrip]) {
                const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
                if (parentItem?.data?.tripCompanions) {
                  mergeTargetToSourceTrip[item.mergeIntoExistingTrip] = parentItem.data;
                }
              }
              // Item should be added to an existing trip
              restructuredData.standaloneHotels.push({
                ...item.data,
                tripId: item.mergeIntoExistingTrip
              });
            } else if (item.parentTripId) {
              const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
              if (parentItem && tripMap[parentItem.originalId]) {
                tripMap[parentItem.originalId].hotels.push(item.data);
              } else {
                // Parent trip was not selected, treat this as a standalone hotel
                restructuredData.standaloneHotels.push(item.data);
              }
            } else {
              restructuredData.standaloneHotels.push(item.data);
            }
          } else if (item.type === 'transportation') {
            if (item.mergeIntoExistingTrip) {
              // Track the source trip for this merge to add companions later
              if (!mergeTargetToSourceTrip[item.mergeIntoExistingTrip]) {
                const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
                if (parentItem?.data?.tripCompanions) {
                  mergeTargetToSourceTrip[item.mergeIntoExistingTrip] = parentItem.data;
                }
              }
              // Item should be added to an existing trip
              restructuredData.standaloneTransportation.push({
                ...item.data,
                tripId: item.mergeIntoExistingTrip
              });
            } else if (item.parentTripId) {
              const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
              if (parentItem && tripMap[parentItem.originalId]) {
                tripMap[parentItem.originalId].transportation.push(item.data);
              } else {
                // Parent trip was not selected, treat this as a standalone transportation
                restructuredData.standaloneTransportation.push(item.data);
              }
            } else {
              restructuredData.standaloneTransportation.push(item.data);
            }
          } else if (item.type === 'carRental') {
            if (item.mergeIntoExistingTrip) {
              // Track the source trip for this merge to add companions later
              if (!mergeTargetToSourceTrip[item.mergeIntoExistingTrip]) {
                const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
                if (parentItem?.data?.tripCompanions) {
                  mergeTargetToSourceTrip[item.mergeIntoExistingTrip] = parentItem.data;
                }
              }
              // Item should be added to an existing trip
              restructuredData.standaloneCarRentals.push({
                ...item.data,
                tripId: item.mergeIntoExistingTrip
              });
            } else if (item.parentTripId) {
              const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
              if (parentItem && tripMap[parentItem.originalId]) {
                tripMap[parentItem.originalId].carRentals.push(item.data);
              } else {
                // Parent trip was not selected, treat this as a standalone car rental
                restructuredData.standaloneCarRentals.push(item.data);
              }
            } else {
              restructuredData.standaloneCarRentals.push(item.data);
            }
          } else if (item.type === 'event') {
            if (item.mergeIntoExistingTrip) {
              // Track the source trip for this merge to add companions later
              if (!mergeTargetToSourceTrip[item.mergeIntoExistingTrip]) {
                const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
                if (parentItem?.data?.tripCompanions) {
                  mergeTargetToSourceTrip[item.mergeIntoExistingTrip] = parentItem.data;
                }
              }
              // Item should be added to an existing trip
              restructuredData.standaloneEvents.push({
                ...item.data,
                tripId: item.mergeIntoExistingTrip
              });
            } else if (item.parentTripId) {
              const parentItem = importPreview.items.find((i: any) => i.id === item.parentTripId);
              if (parentItem && tripMap[parentItem.originalId]) {
                tripMap[parentItem.originalId].events.push(item.data);
              } else {
                // Parent trip was not selected, treat this as a standalone event
                restructuredData.standaloneEvents.push(item.data);
              }
            } else {
              restructuredData.standaloneEvents.push(item.data);
            }
          } else if (item.type === 'voucher') {
            restructuredData.vouchers.push(item.data);
          } else if (item.type === 'companion') {
            restructuredData.companions.push(item.data);
          }
        }
      }

      // Send the restructured data and selected item IDs to the backend
      const response = await settingsApi.importData({
        importData: restructuredData,
        selectedItemIds: selectedItemIds,
        mergeTargetToSourceTrip: mergeTargetToSourceTrip
      });

      if (response && response.success) {
        successMessage = `Successfully imported ${response.stats ? Object.values(response.stats).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0) : selectedItemIds.length} items`;
        selectedFile = null;
        importPreview = null;
        selectedItems = {};

        // Dispatch custom event to notify parent (dashboard) to refresh data
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dataImported', { detail: { stats: response.stats } }));
        }

        setTimeout(() => {
          successMessage = null;
        }, 5000);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to import data';
    } finally {
      importLoading = false;
    }
  }

  function toggleSelectSection(sectionKey: string, items: any[], selected: boolean) {
    const itemIds = items.map(i => i.id);
    itemIds.forEach(id => {
      selectedItems[id] = selected;
    });
    selectedItems = { ...selectedItems };
  }

  function toggleItem(itemId: string, selected: boolean) {
    selectedItems[itemId] = selected;
    selectedItems = { ...selectedItems };
  }

  function toggleTripWithChildren(tripId: string, selected: boolean) {
    selectedItems[tripId] = selected;

    // If selecting a trip, also select all its children
    if (selected) {
      const tripItem = importPreview.items.find(i => i.id === tripId);
      if (tripItem && tripItem.children) {
        ['flights', 'hotels', 'transportation', 'carRentals', 'events'].forEach(childType => {
          if (tripItem.children[childType] && tripItem.children[childType].length > 0) {
            tripItem.children[childType].forEach(childId => {
              selectedItems[childId] = true;
            });
          }
        });
      }
    }
    // If deselecting a trip, just deselect the trip itself, not its children

    selectedItems = { ...selectedItems };
  }

  function getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      trip: '✈️',
      flight: '✈️',
      hotel: '🏨',
      transportation: '🚗',
      carRental: '🚙',
      event: '🎉',
      voucher: '🎁',
      companion: '👥'
    };
    return icons[type] || '📋';
  }

</script>

<div class="settings-backup-container">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if successMessage}
    <Alert type="success" message={successMessage} dismissible />
  {/if}

  <!-- Export Section -->
  <div class="export-section">
    <div class="section-header">
      <div class="icon-box export">
        <span class="material-symbols-outlined">download</span>
      </div>
      <h3>Export Data</h3>
    </div>

    <Button
      variant="primary"
      on:click={handleExport}
      disabled={loading}
      loading={loading}
    >
      <span class="material-symbols-outlined">download</span>
      Download Backup
    </Button>
  </div>

  <!-- Import Section -->
  <div class="import-section">
    <div class="section-header">
      <div class="icon-box import">
        <span class="material-symbols-outlined">upload</span>
      </div>
      <h3>Import Data</h3>
    </div>

    <div class="file-input-wrapper">
      <input
        type="file"
        accept=".json"
        id="file-input"
        on:change={handleFileSelect}
        disabled={previewLoading || importLoading}
      />
      <label for="file-input" class="file-label">
        <span class="material-symbols-outlined">description</span>
        <span>Choose JSON File</span>
      </label>
    </div>

    {#if selectedFile}
      <div class="selected-file">
        <span class="material-symbols-outlined">check_circle</span>
        <div>
          <p class="file-name">{selectedFile.name}</p>
          <p class="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Preview Section (Full Width) -->
  {#if importPreview && importPreview.items && importPreview.items.length > 0}
    <div class="preview-section">
        <!-- Summary Stats Box -->
        {#if importPreview.stats}
          <div class="preview-summary-box">
            <h4 class="summary-title">Import Summary</h4>
            <div class="summary-grid">
              <div>
                <p class="summary-stat"><span class="font-semibold">{importPreview.stats.totalItems}</span> total items</p>
                <p class="summary-subtext">{importPreview.stats.totalDuplicates} possible duplicates</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- Items List - Organized by Sections -->
        <div class="preview-lists">
          <!-- Define sections to display -->
          {#each [
            { key: 'trips', label: 'Trips', icon: 'luggage' },
            { key: 'standaloneFlights', label: 'Standalone Flights', icon: 'flight' },
            { key: 'standaloneHotels', label: 'Standalone Hotels', icon: 'apartment' },
            { key: 'standaloneTransportation', label: 'Standalone Transportation', icon: 'local_taxi' },
            { key: 'standaloneCarRentals', label: 'Standalone Car Rentals', icon: 'directions_car' },
            { key: 'standaloneEvents', label: 'Standalone Events', icon: 'event' },
            { key: 'vouchers', label: 'Vouchers & Credits', icon: 'card_giftcard' },
            { key: 'companions', label: 'Travel Companions', icon: 'person_add' }
          ] as section}
            {@const sectionItems = importPreview.items.filter(i => i.category === section.key)}
            {#if sectionItems.length > 0}
              {@const sectionDuplicates = sectionItems.filter(i => i.isDuplicate).length}
              <div class="section-group">
                <!-- Section Header -->
                <div class="section-header-bar">
                  <div class="section-header-left">
                    <span class="material-symbols-outlined section-icon">{section.icon}</span>
                    <h4 class="section-title">{section.label}</h4>
                    <span class="section-badge">{sectionItems.length} items</span>
                    {#if sectionDuplicates > 0}
                      <span class="section-badge duplicate-badge">{sectionDuplicates} duplicates</span>
                    {/if}
                  </div>
                  <!-- Select All for this Section -->
                  <label class="section-select-all">
                    <input
                      type="checkbox"
                      checked={sectionItems.every(i => selectedItems[i.id])}
                      on:change={(e) => toggleSelectSection(section.key, sectionItems, (e.target as HTMLInputElement).checked)}
                      disabled={importLoading}
                    />
                    <span>All</span>
                  </label>
                </div>

                <!-- Section Items -->
                <div class="section-items">
                  {#each sectionItems as item (item.id)}
                    <!-- Parent Item -->
                    <div class="item-card" class:duplicate={item.isDuplicate}>
                      {#if item.isDuplicate && item.duplicateOf}
                        <div class="duplicate-badge-box">
                          <span class="material-symbols-outlined">warning</span>
                          <span>Possible duplicate: {item.duplicateOf.name}</span>
                        </div>
                      {/if}
                      <div class="item-checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="item-{item.id}"
                          checked={selectedItems[item.id] || false}
                          on:change={(e) => {
                            section.key === 'trips'
                              ? toggleTripWithChildren(item.id, (e.target as HTMLInputElement).checked)
                              : toggleItem(item.id, (e.target as HTMLInputElement).checked);
                          }}
                          disabled={importLoading}
                        />
                        <label for="item-{item.id}" class="item-label">
                          <div class="item-main-content">
                            <span class="item-name-text">{item.name}</span>
                            {#if item.summary}
                              <p class="item-summary-text">{item.summary}</p>
                            {/if}
                          </div>
                        </label>
                      </div>
                    </div>

                    <!-- Nested Children (only for trips) -->
                    {#if section.key === 'trips' && item.children}
                      <div class="trip-children">
                        {#each ['flights', 'hotels', 'transportation', 'carRentals', 'events'] as childType}
                          {#if item.children[childType] && item.children[childType].length > 0}
                            {#each item.children[childType] as childId}
                              {@const childItem = importPreview.items.find(i => i.id === childId)}
                              {#if childItem}
                                <div class="item-card item-card-nested" class:duplicate={childItem.isDuplicate}>
                                  {#if childItem.isDuplicate && childItem.duplicateOf}
                                    <div class="duplicate-badge-box">
                                      <span class="material-symbols-outlined">warning</span>
                                      <span>Duplicate</span>
                                    </div>
                                  {/if}
                                  <div class="item-checkbox-wrapper">
                                    <input
                                      type="checkbox"
                                      id="item-{childItem.id}"
                                      checked={selectedItems[childItem.id] || false}
                                      on:change={(e) => {
                                        toggleItem(childItem.id, (e.target as HTMLInputElement).checked);
                                      }}
                                      disabled={importLoading}
                                    />
                                    <label for="item-{childItem.id}" class="item-label">
                                      <div class="item-main-content">
                                        <span class="item-name-text">{childItem.name}</span>
                                        {#if childItem.summary}
                                          <p class="item-summary-text">{childItem.summary}</p>
                                        {/if}
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              {/if}
                            {/each}
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>

        <!-- Action Buttons -->
        <div class="preview-actions">
          <Button
            variant="primary"
            on:click={handleConfirmImport}
            disabled={Object.values(selectedItems).every((v) => !v) || importLoading}
            loading={importLoading}
          >
            <span class="material-symbols-outlined">check</span>
            Import Selected
          </Button>
          <Button
            variant="secondary"
            on:click={() => {
              importPreview = null;
              selectedItems = {};
            }}
            disabled={importLoading}
          >
            <span class="material-symbols-outlined">arrow_back</span>
            Back
          </Button>
        </div>
      </div>
    {/if}
</div>

<style>
  .settings-backup-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    min-width: 0;
  }

  /* Alert messages span full width */
  .settings-backup-container > :global(.alert) {
    grid-column: 1 / -1;
  }

  /* Preview section spans full width */
  .settings-backup-container > .preview-section {
    grid-column: 1 / -1;
  }

  .export-section,
  .import-section {
    background: #ffffff90;
    border: 1px solid #e5e7eb;
    /* border: 1px solid #e5e7eb; */
    border-radius: 0.375rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-header {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.25rem;
  }

  .icon-box.export {
    background: #dbeafe;
    color: #2563eb;
  }

  .icon-box.import {
    background: #fce7f3;
    color: #be185d;
  }

  .section-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1f2937;
  }

  .file-input-wrapper {
    position: relative;
  }

  #file-input {
    display: none;
  }

  .file-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    padding: 0.5rem 1rem;
    border: 2px dashed #d0d0d0;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    color: #1976d2;
    font-size: 0.875rem;
    font-size: 0.8rem;
    transition: all 0.2s ease;
    background: #f9f9f9;
  }

  .file-label:hover {
    border-color: #1976d2;
    background: #f0f7ff;
  }

  .file-label :global(.material-symbols-outlined) {
    font-size: 28px;
    font-size: 1rem;
  }

  .selected-file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #e8f5e9;
    border: 1px solid #c8e6c9;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .selected-file :global(.material-symbols-outlined) {
    color: #4caf50;
    font-size: 28px;
  }

  .file-name {
    margin: 0;
    font-weight: 600;
    font-size: 0.8rem;
    color: #1a1a1a;
  }

  .file-size {
    margin: 0.125rem 0 0 0;
    font-size: 0.7rem;
    color: #666;
  }

  .preview-section {
    padding-top: 0;
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview-lists {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #e5e7eb;
    gap: 0.5rem;
  }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .section-select-all {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.7rem;
    color: #666;
    white-space: nowrap;
  }

  .section-select-all input[type='checkbox'] {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }

  .section-icon {
    font-size: 16px;
    color: #6b7280;
  }

  .section-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: #111827;
  }

  .section-badge {
    display: inline-block;
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 0.25rem;
  }

  .section-badge.duplicate-badge {
    background: #fef3c7;
    color: #92400e;
  }

  .section-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .trip-children {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-left: 1.5rem;
    padding-left: 0.75rem;
    border-left: 2px solid #bfdbfe;
  }

  .item-card-nested {
    background-color: #f9fafb;
  }

  .preview-summary-box {
    padding: 0.5rem 0.75rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 4px;
  }

  .summary-title {
    margin: 0 0 0.25rem 0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #1e3a8a;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.3rem;
    font-size: 0.7rem;
  }

  .summary-stat {
    margin: 0;
    color: #1e40af;
    line-height: 1.2;
  }

  .summary-subtext {
    margin: 0.075rem 0 0 0;
    font-size: 0.65rem;
    color: #3b82f6;
  }

  .item-card {
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 0.5rem;
    transition: all 0.2s ease;
    position: relative;
  }

  .item-card:hover {
    background: #f9fafb;
  }

  .item-card.duplicate {
    background: #fffbeb;
    border-color: #fef08a;
  }

  .item-checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .item-checkbox-wrapper input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin-top: 0.15rem;
    flex-shrink: 0;
  }

  .item-label {
    display: flex;
    flex: 1;
    cursor: pointer;
  }

  .item-main-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
  }

  .item-name-text {
    font-weight: 600;
    font-size: 0.8rem;
    color: #111827;
  }

  .item-summary-text {
    margin: 0;
    font-size: 0.7rem;
    color: #6b7280;
    line-height: 1.3;
  }

  .duplicate-badge-box {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.2rem 0.4rem;
    background: #fef3c7;
    color: #a16207;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    border: 1px solid #fcd34d;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    white-space: nowrap;
  }

  .duplicate-badge-box :global(.material-symbols-outlined) {
    font-size: 12px;
  }

  .preview-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.75rem;
    padding-bottom: 1rem;
    border-top: 1px solid #e5e7eb;
    justify-content: flex-start;
  }

  .export-section :global(button),
  .import-section :global(button) {
    padding: 0.5rem 1rem;
    border: none;
    border: 2px solid #3b82f6;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }

  @media (max-width: 768px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .preview-actions {
      flex-direction: column;
    }
  }
</style>
