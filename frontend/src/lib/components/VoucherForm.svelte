<script lang="ts">
  import { settingsApi } from '$lib/services/settings';
  import { Button, FormGroup, FormRow, Input, TextArea, Alert } from '$lib/components/ui';
  import '$lib/styles/form-styles.css';

  export let tripId: string;
  export let voucherId: string | null = null;
  export let voucher: any = null;
  export let onSuccess: ((voucher: any) => void) | null = null;
  export let onCancel: (() => void) | null = null;

  let loading = false;
  let error: string | null = null;
  let formData = {
    type: voucher?.type || 'TRAVEL_CREDIT',
    issuer: voucher?.issuer || '',
    voucherNumber: voucher?.voucherNumber || '',
    associatedAccount: voucher?.associatedAccount || '',
    pinCode: voucher?.pinCode || '',
    currency: voucher?.currency || 'USD',
    totalValue: voucher?.totalValue ? parseFloat(voucher.totalValue).toString() : '',
    expirationDate: voucher?.expirationDate ? new Date(voucher.expirationDate).toISOString().split('T')[0] : '',
    notes: voucher?.notes || ''
  };

  const voucherTypeOptions = [
    { value: 'TRAVEL_CREDIT', label: 'Travel Credit' },
    { value: 'UPGRADE_CERT', label: 'Upgrade Certificate' },
    { value: 'REGIONAL_UPGRADE_CERT', label: 'Regional Upgrade Cert' },
    { value: 'GLOBAL_UPGRADE_CERT', label: 'Global Upgrade Cert' },
    { value: 'COMPANION_CERT', label: 'Companion Certificate' },
    { value: 'GIFT_CARD', label: 'Gift Card' },
    { value: 'MISC', label: 'Miscellaneous' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  async function handleSubmit() {
    try {
      // Validation
      if (!formData.voucherNumber.trim()) {
        error = 'Voucher number is required';
        return;
      }

      if (!formData.issuer.trim()) {
        error = 'Issuer is required';
        return;
      }

      // Only validate totalValue if type requires it
      const certificateTypes = ['UPGRADE_CERT', 'COMPANION_CERT', 'REGIONAL_UPGRADE_CERT', 'GLOBAL_UPGRADE_CERT'];
      if (!certificateTypes.includes(formData.type)) {
        if (!formData.totalValue) {
          error = 'Total value is required for this voucher type';
          return;
        }

        const totalValue = parseFloat(formData.totalValue);
        if (isNaN(totalValue) || totalValue <= 0) {
          error = 'Total value must be a positive number';
          return;
        }
      }

      loading = true;
      error = null;

      let savedVoucher;
      const submitData = {
        ...formData,
        totalValue: formData.totalValue ? parseFloat(formData.totalValue) : null
      };

      if (voucherId) {
        // Update existing voucher
        savedVoucher = await settingsApi.updateVoucher(voucherId, submitData);
        savedVoucher = savedVoucher.data || savedVoucher;
      } else {
        // Create new voucher
        savedVoucher = await settingsApi.createVoucher(submitData);
        savedVoucher = savedVoucher.data || savedVoucher;
      }

      if (onSuccess) {
        onSuccess(savedVoucher);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save voucher';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }
</script>

<style>
  /* Match ItemEditForm button spacing */
  .edit-content .form-buttons {
    margin-top: clamp(0.75rem, 2vw, 1rem);
  }
</style>

<div class="edit-content">
  {#if error}
    <Alert variant="error" dismissible={false}>{error}</Alert>
  {/if}

  <form on:submit|preventDefault={handleSubmit}>
      <div class="form-fields">
        <FormGroup label="Voucher Number *" id="voucherNumber">
          <Input
            id="voucherNumber"
            type="text"
            bind:value={formData.voucherNumber}
            placeholder="e.g., 123456789"
            required
          />
        </FormGroup>

        <FormRow columns={2}>
          <FormGroup label="Type *" id="type">
            <select id="type" bind:value={formData.type} required>
              {#each voucherTypeOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </FormGroup>

          <FormGroup label="Issuer *" id="issuer">
            <Input
              id="issuer"
              type="text"
              bind:value={formData.issuer}
              placeholder="e.g., United Airlines"
              required
            />
          </FormGroup>
        </FormRow>

        <FormRow columns={2}>
          <FormGroup label="Associated Account" id="associatedAccount">
            <Input
              id="associatedAccount"
              type="text"
              bind:value={formData.associatedAccount}
              placeholder="e.g., Frequent flyer number"
            />
          </FormGroup>

          <FormGroup label="PIN Code" id="pinCode">
            <Input
              id="pinCode"
              type="password"
              bind:value={formData.pinCode}
              placeholder="PIN or security code"
            />
          </FormGroup>
        </FormRow>

        <FormRow columns={2}>
          <FormGroup label="Currency" id="currency">
            <select id="currency" bind:value={formData.currency}>
              {#each currencyOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </FormGroup>

          <FormGroup label="Total Value" id="totalValue">
            <Input
              id="totalValue"
              type="number"
              bind:value={formData.totalValue}
              placeholder="0.00"
            />
          </FormGroup>
        </FormRow>

        <FormGroup label="Expiration Date" id="expirationDate">
          <Input id="expirationDate" type="date" bind:value={formData.expirationDate} />
        </FormGroup>

        <FormGroup label="Notes" id="notes">
          <TextArea
            id="notes"
            bind:value={formData.notes}
            placeholder="Any additional information about this voucher..."
            rows={3}
          />
        </FormGroup>
      </div>

      <div class="form-buttons">
        <Button type="submit" variant="primary" disabled={loading} loading={loading} fullWidth>
          {voucherId ? 'Update' : 'Add Voucher'}
        </Button>
        <Button type="button" variant="secondary" on:click={handleCancel} disabled={loading} fullWidth>
          Cancel
        </Button>
      </div>
    </form>
  </div>
