<script lang="ts">
  import { vouchersApi } from '$lib/services/api';
  import { tripStoreActions } from '$lib/stores/tripStore';
  import Card from './Card.svelte';
  import Button from './Button.svelte';
  import Grid from './Grid.svelte';
  import Alert from './Alert.svelte';

  export let tripId: string;
  export let vouchers: any[] = [];
  export let onEditVoucher: ((voucherId: string) => void) | null = null;
  export let onVouchersUpdate: ((vouchers: any[]) => void) | null = null;

  let loading = false;
  let error: string | null = null;

  async function handleDeleteVoucher(voucherId: string) {
    try {
      loading = true;
      error = null;

      await vouchersApi.delete(voucherId);

      vouchers = vouchers.filter((v) => v.id !== voucherId);
      tripStoreActions.deleteVoucher(voucherId);

      if (onVouchersUpdate) {
        onVouchersUpdate(vouchers);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete voucher';
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return 'No expiration';
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

  function getDiscountText(voucher: any): string {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}% off`;
    } else {
      return `$${parseFloat(voucher.discountValue).toFixed(2)} off`;
    }
  }

  function isExpired(dateString: string): boolean {
    if (!dateString) return false;
    try {
      const expirationDate = new Date(dateString);
      return expirationDate < new Date();
    } catch {
      return false;
    }
  }
</script>

<div class="vouchers-list">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if vouchers && vouchers.length > 0}
    <Grid columns={2} responsive={true} gap="1rem">
      {#each vouchers as voucher (voucher.id)}
        <Card title={voucher.code} subtitle={voucher.provider || 'Voucher'}>
          <div class="voucher-info">
            <div class="discount-badge" class:expired={isExpired(voucher.expirationDate)}>
              {getDiscountText(voucher)}
            </div>

            {#if voucher.description}
              <p class="description">
                {voucher.description}
              </p>
            {/if}

            {#if voucher.expirationDate}
              <div class="expiration" class:expired-text={isExpired(voucher.expirationDate)}>
                {isExpired(voucher.expirationDate) ? 'Expired: ' : 'Expires: '}
                {formatDate(voucher.expirationDate)}
              </div>
            {/if}

            {#if voucher.notes}
              <div class="notes">
                <strong>Notes:</strong>
                <p>{voucher.notes}</p>
              </div>
            {/if}
          </div>

          <div slot="footer" class="voucher-actions">
            <Button
              variant="secondary"
              disabled={loading}
              on:click={() => {
                if (onEditVoucher) onEditVoucher(voucher.id);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              disabled={loading}
              on:click={() => handleDeleteVoucher(voucher.id)}
            >
              Delete
            </Button>
          </div>
        </Card>
      {/each}
    </Grid>
  {:else}
    <div class="empty-state">
      <p>No vouchers added yet</p>
    </div>
  {/if}
</div>

<style>
  .vouchers-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .voucher-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .discount-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #d4edda;
    color: #155724;
    border-radius: 4px;
    font-weight: 600;
    font-size: 1rem;
    width: fit-content;
  }

  .discount-badge.expired {
    background-color: #f8d7da;
    color: #721c24;
  }

  .description {
    margin: 0;
    color: #666;
    font-size: 0.95rem;
  }

  .expiration {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .expiration.expired-text {
    color: #dc3545;
    font-weight: 600;
  }

  .notes {
    padding: 0.75rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .notes strong {
    display: block;
    margin-bottom: 0.25rem;
    color: #333;
  }

  .notes p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .voucher-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: #666;
  }
</style>
