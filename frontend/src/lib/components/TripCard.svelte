<script lang="ts">
  import Card from './Card.svelte';
  import Button from './Button.svelte';
  import CompanionIndicators from './CompanionIndicators.svelte';

  export let tripId: string;
  export let title: string;
  export let destination: string = '';
  export let startDate: string = '';
  export let endDate: string = '';
  export let companions: number = 0;
  export let companionList: any[] = [];
  export let itemCount: number = 0;
  export let onEdit: (() => void) | null = null;
  export let onDelete: (() => void) | null = null;
  export let onView: (() => void) | null = null;

  function formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  function handleDelete() {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      onDelete?.();
    }
  }
</script>

<Card title={title} subtitle={destination} clickable={!!onView}>
  {#if companionList && companionList.length > 0}
    <div slot="indicators">
      <CompanionIndicators companions={companionList} />
    </div>
  {/if}
  <div class="trip-info">
    {#if startDate || endDate}
      <div class="info-row">
        <span class="label">Dates:</span>
        <span class="value">
          {#if startDate}
            {formatDate(startDate)}
          {/if}
          {#if startDate && endDate}
            –
          {/if}
          {#if endDate}
            {formatDate(endDate)}
          {/if}
        </span>
      </div>
    {/if}

    {#if companions > 0}
      <div class="info-row">
        <span class="label">Companions:</span>
        <span class="value">{companions}</span>
      </div>
    {/if}

    {#if itemCount > 0}
      <div class="info-row">
        <span class="label">Items:</span>
        <span class="value">{itemCount}</span>
      </div>
    {/if}
  </div>

  <div slot="footer" class="card-actions">
    {#if onView}
      <Button variant="primary" on:click={onView}>
        View
      </Button>
    {/if}
    {#if onEdit}
      <Button variant="secondary" on:click={onEdit}>
        Edit
      </Button>
    {/if}
    {#if onDelete}
      <Button variant="danger" on:click={handleDelete}>
        Delete
      </Button>
    {/if}
  </div>
</Card>

<style>
  .trip-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
  }

  .label {
    font-weight: 600;
    color: #666;
  }

  .value {
    color: #333;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
