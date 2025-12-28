<script lang="ts">
  export let title: string;
  export let submitLabel: string = 'Submit';
  export let isLoading: boolean = false;
  export let error: string | null = null;
  export let onCancel: (() => void) | null = null;
  export let onDelete: (() => void) | null = null;
  export let isEditing: boolean = false;
  export let itemType: string = '';
  export let itemColor: string = '#3b82f6';
  export let showBackButton: boolean = true;

  function handleBackClick() {
    if (onCancel) {
      onCancel();
    }
  }

  function handleDeleteClick() {
    if (onDelete) {
      onDelete();
    }
  }

  // Map item types to Material Symbols icon names
  const iconMap: { [key: string]: string } = {
    flight: 'flight',
    hotel: 'hotel',
    event: 'event',
    transportation: 'directions_car',
    'car-rental': 'directions_car',
    carRental: 'directions_car',
    voucher: 'card_giftcard'
  };

  const icon = iconMap[itemType] || 'info';
</script>

<div class="sidebar-form-container">
  <!-- Header with back button and icon badge -->
  <div class="form-header">
    <div class="header-left">
      {#if showBackButton}
        <button
          type="button"
          on:click={handleBackClick}
          class="back-button"
          aria-label="Go back"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      {/if}
      <h2>{title}</h2>
    </div>
    {#if itemType}
      <div class="icon-badge" style="background-color: {itemColor}22;">
        <span class="material-symbols-outlined" style="color: {itemColor};">{icon}</span>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="alert alert-error">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault class="form-content">
    <slot />

    <!-- Form actions slot -->
    <div class="form-actions">
      <slot name="actions">
        <button type="submit" disabled={isLoading} class="btn btn-primary">
          {isLoading ? 'Saving...' : submitLabel}
        </button>
        <button type="button" on:click={handleBackClick} class="btn btn-secondary">
          Cancel
        </button>
      </slot>
    </div>
  </form>

  {#if isEditing && onDelete}
    <div class="delete-section">
      <button type="button" on:click={handleDeleteClick} class="btn btn-delete">
        Delete {title}
      </button>
    </div>
  {/if}
</div>

<style>
  .sidebar-form-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .form-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .back-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .back-button:hover {
    color: #4b5563;
    background-color: #f3f4f6;
  }

  h2 {
    margin: 0;
    color: #111827;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .icon-badge {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .material-symbols-outlined {
    font-size: 1rem;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
  }

  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .alert-error {
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    text-align: center;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border: 1px solid #3b82f6;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .delete-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-delete {
    background-color: #ef4444;
    color: white;
    border: 1px solid #ef4444;
    width: 100%;
    flex: none;
  }

  .btn-delete:hover {
    background-color: #dc2626;
    border-color: #dc2626;
  }
</style>
