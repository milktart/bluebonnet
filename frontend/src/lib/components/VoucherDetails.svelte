<script lang="ts">
  import Button from './Button.svelte';
  import { settingsApi } from '$lib/services/settings';

  export let voucherId: string;
  export let voucher: any;
  export let onClose: (() => void) | null = null;
  export let onEdit: ((voucherId: string) => void) | null = null;
  export let onDelete: ((voucherId: string) => void) | null = null;

  let loading = false;

  function formatDate(dateString: string): string {
    if (!dateString) return 'No expiration';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  function getDaysUntilExpiration(dateString: string): number {
    if (!dateString) return -1;
    try {
      const expirationDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expirationDate.setHours(0, 0, 0, 0);
      const diffTime = expirationDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return -1;
    }
  }

  function isExpired(dateString: string): boolean {
    return getDaysUntilExpiration(dateString) < 0;
  }

  function getExpirationStatus(dateString: string): string {
    const daysLeft = getDaysUntilExpiration(dateString);
    if (daysLeft < 0) return 'Expired';
    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return 'Expires in 1 day';
    if (daysLeft <= 7) return `Expires in ${daysLeft} days`;
    if (daysLeft <= 30) return `Expires in ${Math.floor(daysLeft / 7)} weeks`;
    return `Expires in ${Math.floor(daysLeft / 30)} months`;
  }

  function getDiscountText(voucher: any): string {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}% off`;
    } else {
      return `$${parseFloat(voucher.discountValue).toFixed(2)} off`;
    }
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this voucher?')) {
      loading = true;
      try {
        await settingsApi.deleteVoucher(voucherId);
        if (onDelete) {
          onDelete(voucherId);
        }
        if (onClose) {
          onClose();
        }
      } catch (err) {
        alert('Failed to delete voucher');
        loading = false;
      }
    }
  }

  function handleEdit() {
    if (onEdit) {
      onEdit(voucherId);
    }
  }
</script>

<div class="voucher-details">
  <div class="detail-header">
    <h3>{voucher.code}</h3>
    {#if voucher.expirationDate}
      <div class="status-badge" class:expired={isExpired(voucher.expirationDate)}>
        {getExpirationStatus(voucher.expirationDate)}
      </div>
    {/if}
  </div>

  <div class="detail-content">
    <!-- Discount Box -->
    <div class="discount-box">
      <div class="discount-value">{getDiscountText(voucher)}</div>
      {#if voucher.provider}
        <div class="provider">{voucher.provider}</div>
      {/if}
    </div>

    <!-- Details Grid -->
    <div class="details-grid">
      {#if voucher.description}
        <div class="detail-row">
          <label>Description</label>
          <p>{voucher.description}</p>
        </div>
      {/if}

      {#if voucher.expirationDate}
        <div class="detail-row">
          <label>Expiration Date</label>
          <p>{formatDate(voucher.expirationDate)}</p>
        </div>
      {/if}

      {#if voucher.notes}
        <div class="detail-row">
          <label>Notes</label>
          <p>{voucher.notes}</p>
        </div>
      {/if}

      {#if voucher.createdAt}
        <div class="detail-row">
          <label>Added</label>
          <p>{formatDate(voucher.createdAt)}</p>
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="detail-actions">
      <Button
        variant="primary"
        disabled={loading}
        on:click={handleEdit}
      >
        <span class="material-symbols-outlined">edit</span>
        Edit
      </Button>
      <Button
        variant="danger"
        disabled={loading}
        {loading}
        on:click={handleDelete}
      >
        <span class="material-symbols-outlined">delete</span>
        Delete
      </Button>
      {#if onClose}
        <Button
          variant="secondary"
          disabled={loading}
          on:click={onClose}
        >
          Close
        </Button>
      {/if}
    </div>
  </div>
</div>

<style>
  .voucher-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: #ffffff90;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .detail-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
    flex: 1;
    word-break: break-all;
  }

  .status-badge {
    background: #d4edda;
    color: #155724;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .status-badge.expired {
    background: #f8d7da;
    color: #721c24;
  }

  .discount-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 1rem;
  }

  .discount-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .provider {
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .details-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-row p {
    margin: 0;
    color: #333;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .detail-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  :global(.detail-actions button) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
  }

  :global(.detail-actions button .material-symbols-outlined) {
    font-size: 18px;
  }

  @media (max-width: 640px) {
    .detail-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .status-badge {
      align-self: flex-start;
    }

    .detail-actions {
      flex-direction: column;
    }

    :global(.detail-actions button) {
      width: 100%;
    }
  }
</style>
