<script lang="ts">
  import { getFirstError } from '$lib/utils/validation';
  import FormContainer from './FormContainer.svelte';

  export let title: string;
  export let submitLabel: string;
  export let itemType: string;
  export let itemColor: string;
  export let itemId: string | null = null;
  export let tripId: string;
  export let loading = false;
  export let error: string | null = null;
  export let formData: Record<string, any> = {};
  export let validationFn: (data: any) => { isValid: boolean; errors: Record<string, string> };
  export let onSubmit: () => Promise<void>;
  export let onCancel: (() => void) | null = null;

  /**
   * Parse ISO datetime string into separate date and time components
   * Used by all travel item forms to display stored datetimes
   * @param dateTimeStr - ISO datetime string (e.g., "2024-01-15T14:30")
   * @returns Object with date (YYYY-MM-DD) and time (HH:MM) components
   * @example
   * parseDateTime("2024-01-15T14:30Z") → { date: "2024-01-15", time: "14:30" }
   */
  export function parseDateTime(dateTimeStr: string): { date: string; time: string } {
    if (!dateTimeStr) return { date: '', time: '' };
    try {
      const dt = new Date(dateTimeStr);
      const date = dt.toISOString().split('T')[0];
      const time = dt.toTimeString().slice(0, 5);
      return { date, time };
    } catch (e) {
      return { date: '', time: '' };
    }
  }

  /**
   * Auto-sync end date to match start date
   * Prevents impossible date ranges (end before start)
   * Common pattern: departure/arrival, check-in/check-out, start/end
   * @param startDateField - Name of start date field (e.g., 'departureDate')
   * @param endDateField - Name of end date field (e.g., 'arrivalDate')
   */
  export function syncEndDate(startDateField: string, endDateField: string) {
    if (formData[startDateField]) {
      formData[endDateField] = formData[startDateField];
    }
  }

  /**
   * Auto-sync start date to match end date
   * Prevents impossible date ranges when end date is manually changed
   * @param startDateField - Name of start date field
   * @param endDateField - Name of end date field
   */
  export function syncStartDate(startDateField: string, endDateField: string) {
    if (formData[endDateField]) {
      if (!formData[startDateField] || formData[endDateField] < formData[startDateField]) {
        formData[startDateField] = formData[endDateField];
      }
    }
  }

  async function handleSubmit() {
    try {
      // Run validation
      const validation = validationFn(formData);
      if (!validation.isValid) {
        error = getFirstError(validation.errors);
        return;
      }

      loading = true;
      error = null;

      await onSubmit();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
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

<FormContainer
  title={title}
  submitLabel={submitLabel}
  isLoading={loading}
  error={error}
  itemType={itemType}
  itemColor={itemColor}
  isEditing={!!itemId}
  onCancel={handleCancel}
  onDelete={() => {}}
>
  <slot />

  <div slot="actions" class="form-actions">
    <button type="submit" disabled={loading} class="btn btn-primary">
      {submitLabel}
    </button>
    <button type="button" on:click={handleCancel} disabled={loading} class="btn btn-secondary">
      Cancel
    </button>
  </div>
</FormContainer>

<style>
  :global(.two-column) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  :global(.three-column) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  :global(.col-span-2) {
    grid-column: span 2;
  }

  :global(.input-label) {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  :global(.form-input) {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  :global(.form-input:focus) {
    outline: none;
    ring: 2px #3b82f6;
    border-color: #3b82f6;
  }

  :global(.form-input:disabled) {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  :global(.btn) {
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    text-align: center;
  }

  :global(.btn-primary) {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  :global(.btn-primary:hover:not(:disabled)) {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  :global(.btn-secondary) {
    background-color: white;
    color: #374151;
    border-color: #d1d5db;
  }

  :global(.btn-secondary:hover:not(:disabled)) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  @media (max-width: 600px) {
    :global(.two-column),
    :global(.three-column) {
      grid-template-columns: 1fr;
    }

    :global(.col-span-2) {
      grid-column: span 1;
    }
  }
</style>
