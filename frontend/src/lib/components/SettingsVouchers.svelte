<script lang="ts">
  import { onMount } from 'svelte';
  import VoucherForm from './VoucherForm.svelte';
  import VoucherDetails from './VoucherDetails.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';
  import { settingsApi } from '$lib/services/settings';
  import '$lib/styles/form-styles.css';

  export let onEditVoucher: ((voucher: any) => void) | null = null;

  let vouchers: any[] = [];
  let filteredVouchers: any[] = [];
  let loading = true;
  let error: string | null = null;
  let successMessage: string | null = null;

  let currentView: 'list' | 'form' | 'details' = 'list';
  let selectedVoucherId: string | null = null;
  let selectedVoucher: any = null;
  let activeTab: 'open' | 'closed' | 'all' = 'open';

  onMount(async () => {
    await loadVouchers();
  });

  async function loadVouchers() {
    try {
      loading = true;
      error = null;
      const response = await settingsApi.getVouchers();
      vouchers = response.data || response || [];
      filterVouchers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load vouchers';
    } finally {
      loading = false;
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

  function filterVouchers() {
    if (activeTab === 'open') {
      filteredVouchers = vouchers.filter((v) => !isExpired(v.expirationDate));
    } else if (activeTab === 'closed') {
      filteredVouchers = vouchers.filter((v) => isExpired(v.expirationDate));
    } else {
      filteredVouchers = vouchers;
    }
  }

  function handleTabChange(tab: 'open' | 'closed' | 'all') {
    activeTab = tab;
    filterVouchers();
  }

  function handleEditVoucher(voucherId: string) {
    const voucher = vouchers.find((v) => v.id === voucherId);
    if (onEditVoucher) {
      // Call parent callback to open in tertiary sidebar
      onEditVoucher(voucher);
    } else {
      // Default behavior: open in secondary sidebar
      selectedVoucherId = voucherId;
      selectedVoucher = voucher;
      currentView = 'form';
    }
  }

  function handleViewDetails(voucherId: string) {
    selectedVoucherId = voucherId;
    selectedVoucher = vouchers.find((v) => v.id === voucherId);
    currentView = 'details';
  }

  async function handleFormSuccess(event: any) {
    const newVoucher = event.detail || event;
    if (selectedVoucherId) {
      // Update existing
      vouchers = vouchers.map((v) => (v.id === selectedVoucherId ? newVoucher : v));
      successMessage = 'Voucher updated successfully';
    } else {
      // Create new
      vouchers = [...vouchers, newVoucher];
      successMessage = 'Voucher added successfully';
    }
    filterVouchers();
    currentView = 'list';
    selectedVoucherId = null;
    selectedVoucher = null;

    setTimeout(() => {
      successMessage = null;
    }, 3000);
  }

  function handleFormCancel() {
    currentView = 'list';
    selectedVoucherId = null;
    selectedVoucher = null;
  }

  function handleDetailsClose() {
    currentView = 'list';
    selectedVoucherId = null;
    selectedVoucher = null;
  }

  async function handleDeleteVoucher(voucherId: string) {
    vouchers = vouchers.filter((v) => v.id !== voucherId);
    filterVouchers();
    currentView = 'list';
    selectedVoucherId = null;
    selectedVoucher = null;
    successMessage = 'Voucher deleted successfully';

    setTimeout(() => {
      successMessage = null;
    }, 3000);
  }

  function handleDetailsEdit(voucherId: string) {
    currentView = 'form';
    selectedVoucherId = voucherId;
    selectedVoucher = vouchers.find((v) => v.id === voucherId);
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

  function formatVoucherType(type: string): string {
    if (!type) return 'Unknown';
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

</script>

<div class="settings-vouchers-container">
  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  {#if successMessage}
    <Alert type="success" message={successMessage} dismissible />
  {/if}

  {#if currentView === 'list'}
    <div class="vouchers-view">
      {#if !loading}
        <div class="tabs-header">
          <div class="tabs">
            <button
              class="tab-btn"
              class:active={activeTab === 'open'}
              on:click={() => handleTabChange('open')}
            >
              Open ({vouchers.filter((v) => !isExpired(v.expirationDate)).length})
            </button>
            <button
              class="tab-btn"
              class:active={activeTab === 'closed'}
              on:click={() => handleTabChange('closed')}
            >
              Expired ({vouchers.filter((v) => isExpired(v.expirationDate)).length})
            </button>
          </div>
        </div>
      {/if}

      {#if loading}
        <div class="loading-state">
          <span class="material-symbols-outlined">hourglass_empty</span>
          <p>Loading vouchers...</p>
        </div>
      {:else if filteredVouchers.length === 0}
        <div class="empty-state">
          <span class="material-symbols-outlined">card_giftcard</span>
          <p>
            {activeTab === 'open' && vouchers.length === 0 ? 'No vouchers yet' : 'No vouchers in this category'}
          </p>
        </div>
      {:else}
        <div class="vouchers-table-container">
          <table class="vouchers-table">
            <thead>
              <tr>
                <th>Voucher Number</th>
                <th>Type</th>
                <th>Issuer</th>
                <th>Remaining Value</th>
                <th>Expiration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredVouchers as voucher (voucher.id)}
                <tr class:expired={voucher.isExpired}>
                  <td class="voucher-number">{voucher.voucherNumber}</td>
                  <td>{formatVoucherType(voucher.type)}</td>
                  <td>{voucher.issuer}</td>
                  <td class="currency-value">
                    {voucher.remainingBalance !== undefined ? `${voucher.currency} ${parseFloat(voucher.remainingBalance).toFixed(2)}` : '—'}
                  </td>
                  <td>{formatDate(voucher.expirationDate)}</td>
                  <td>
                    <span class="status-badge" class:open={voucher.status === 'OPEN'} class:used={voucher.status === 'USED'} class:expired-badge={voucher.isExpired}>
                      {voucher.status}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <div class="actions-group">
                      <button class="action-btn edit" on:click={() => handleEditVoucher(voucher.id)} title="Edit">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button class="action-btn delete" on:click={() => handleDeleteVoucher(voucher.id)} title="Delete" disabled={loading}>
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {:else if currentView === 'form'}
    <div class="form-view">
      <button class="back-btn" on:click={handleFormCancel}>
        <span class="material-symbols-outlined">arrow_back</span>
        Back to Vouchers
      </button>
      <VoucherForm
        tripId=""
        voucherId={selectedVoucherId}
        voucher={selectedVoucher}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  {:else if currentView === 'details' && selectedVoucher}
    <div class="details-view">
      <button class="back-btn" on:click={handleDetailsClose}>
        <span class="material-symbols-outlined">arrow_back</span>
        Back to Vouchers
      </button>
      <VoucherDetails
        voucherId={selectedVoucherId || ''}
        voucher={selectedVoucher}
        onClose={handleDetailsClose}
        onEdit={handleDetailsEdit}
        onDelete={handleDeleteVoucher}
      />
    </div>
  {/if}
</div>

<style>
  .settings-vouchers-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
  }

  .vouchers-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tabs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0;
  }

  .tabs {
    display: flex;
    gap: 0;
    flex: 1;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }

  .tab-btn:hover {
    color: #374151;
  }

  .tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    text-align: center;
    color: #999;
  }

  .empty-state :global(.material-symbols-outlined) {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }

  .form-view,
  .details-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    color: #1976d2;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .back-btn:hover {
    color: #1565c0;
  }

  .back-btn :global(.material-symbols-outlined) {
    font-size: 20px;
  }

  .vouchers-table-container {
    overflow-x: auto;
    border: 1px solid #e0e0e0;
    border-radius: 0.425rem;
    background: #ffffff90;
  }

  .vouchers-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    font-size: 0.75rem;
  }

  .vouchers-table thead {
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }

  .vouchers-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    vertical-align: middle;
    white-space: nowrap;
  }

  .vouchers-table tbody tr {
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
  }

  .vouchers-table tbody tr:hover {
    background-color: #fafafa;
  }

  .vouchers-table tbody tr.expired {
    opacity: 0.7;
  }

  .vouchers-table tbody tr:last-child td {
    border-bottom: none;
  }

  .vouchers-table td {
    padding: 0.875rem;
    color: #1f2937;
    vertical-align: middle;
  }

  .vouchers-table td.voucher-number {
    font-family: 'Courier New', monospace;
    font-weight: 500;
    color: #1f2937;
  }

  .vouchers-table td.currency-value {
    font-family: 'Courier New', monospace;
    color: #1f2937;
    font-weight: 500;
  }

  .status-badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .status-badge.open {
    background-color: #d4edda;
    color: #155724;
  }

  .status-badge.used {
    background-color: #cce5ff;
    color: #004085;
  }

  .status-badge.expired-badge {
    background-color: #f8d7da;
    color: #721c24;
  }

  .actions-cell {
    text-align: center;
    padding: 0.875rem 0.5rem;
  }

  .actions-group {
    display: flex;
    gap: 0.5rem;
    justify-content: end;
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
  }

  .action-btn :global(.material-symbols-outlined) {
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn.edit {
    background-color: #e3f2fd;
    color: #1976d2;
  }

  .action-btn.edit:hover:not(:disabled) {
    background-color: #bbdefb;
  }

  .action-btn.delete {
    background-color: #ffebee;
    color: #c62828;
  }

  .action-btn.delete:hover:not(:disabled) {
    background-color: #ffcdd2;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .vouchers-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .tabs {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .vouchers-table-container {
      font-size: 0.8rem;
    }

    .vouchers-table th,
    .vouchers-table td {
      padding: 0.5rem;
    }

    .status-badge {
      font-size: 0.7rem;
    }
  }
</style>
