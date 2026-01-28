<script lang="ts">
  /**
   * CompanionsList Component
   * Reusable companion list display with configurable actions
   *
   * Consolidates duplicate list display logic from:
   * - CompanionManagement.svelte
   * - CompanionsFormSection.svelte
   * - ItemCompanionsSelector.svelte
   *
   * Features:
   * - Flexible action buttons (edit, delete, checkbox, etc.)
   * - Built-in sorting and search support
   * - Event emission for user actions
   * - Clean, reusable interface
   */

  import { getCompanionDisplayName, getCompanionInitials } from '$lib/utils/companionFormatter';

  // Required props
  export let companions: any[] = [];

  // Optional configuration
  export let searchQuery: string = '';
  export let sortByOwner: boolean = false;
  export let ownerId: string | null = null;
  export let allowCheckboxes: boolean = false;
  export let selectedCompanionIds: Set<string> = new Set();
  export let canEdit: boolean = true;

  // Display customization
  export let showPermissions: boolean = false;
  export let permissionsLabels: Record<string, string> = {};

  // Event handlers
  export let onEdit: ((companion: any) => void) | null = null;
  export let onDelete: ((companionId: string) => void) | null = null;
  export let onSelectChange: ((companionId: string, selected: boolean) => void) | null = null;

  // Compute display list based on search and sort
  $: filteredCompanions = companions.filter((c) => {
    if (!searchQuery) return true;
    const name = getCompanionDisplayName(c).toLowerCase();
    const email = c.email?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  $: displayCompanions = sortByOwner && ownerId
    ? [...filteredCompanions].sort((a, b) => {
        const aIsOwner = a.userId === ownerId;
        const bIsOwner = b.userId === ownerId;
        if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1;
        return getCompanionDisplayName(a).localeCompare(getCompanionDisplayName(b));
      })
    : filteredCompanions;

  function toggleSelect(companionId: string) {
    if (selectedCompanionIds.has(companionId)) {
      selectedCompanionIds.delete(companionId);
    } else {
      selectedCompanionIds.add(companionId);
    }
    selectedCompanionIds = selectedCompanionIds; // Trigger reactivity
    onSelectChange?.(companionId, selectedCompanionIds.has(companionId));
  }

  function handleEdit(companion: any) {
    onEdit?.(companion);
  }

  function handleDelete(companion: any) {
    onDelete?.(companion.id);
  }
</script>

<div class="companion-list">
  {#if displayCompanions.length === 0}
    <div class="empty-state">
      <p>{searchQuery ? 'No companions found matching your search' : 'No companions'}</p>
    </div>
  {:else}
    <div class="companions-grid">
      {#each displayCompanions as companion (companion.id)}
        <div class="companion-item">
          <div class="companion-header">
            {#if allowCheckboxes}
              <input
                type="checkbox"
                checked={selectedCompanionIds.has(companion.id)}
                on:change={() => toggleSelect(companion.id)}
                aria-label="Select {getCompanionDisplayName(companion)}"
              />
            {/if}

            <div class="companion-info">
              <div class="companion-avatar">
                {getCompanionInitials(companion)}
              </div>
              <div class="companion-details">
                <div class="name">
                  {getCompanionDisplayName(companion, companion.userId === ownerId)}
                </div>
                <div class="email">{companion.email}</div>
              </div>
            </div>
          </div>

          {#if showPermissions && companion.permissions}
            <div class="permissions">
              {#each Object.entries(companion.permissions) as [key, value]}
                {#if value}
                  <span class="permission-badge">
                    {permissionsLabels[key] || key}
                  </span>
                {/if}
              {/each}
            </div>
          {/if}

          {#if canEdit && (onEdit || onDelete)}
            <div class="actions">
              {#if onEdit}
                <button
                  class="action-btn edit"
                  on:click={() => handleEdit(companion)}
                  title="Edit companion"
                >
                  ✏️
                </button>
              {/if}
              {#if onDelete}
                <button
                  class="action-btn delete"
                  on:click={() => handleDelete(companion)}
                  title="Delete companion"
                >
                  🗑️
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .companion-list {
    width: 100%;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #666;
  }

  .companions-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .companion-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
    background: #f9f9f9;
  }

  .companion-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .companion-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .companion-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: #e0e7ff;
    color: #4f46e5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.875rem;
  }

  .companion-details {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .email {
    font-size: 0.875rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .permissions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .permission-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #e0e7ff;
    color: #4f46e5;
    border-radius: 0.25rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .action-btn {
    padding: 0.25rem 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .action-btn:hover {
    opacity: 1;
  }

  input[type='checkbox'] {
    cursor: pointer;
  }
</style>
