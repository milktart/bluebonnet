<script lang="ts">
  export let label: string = '';
  export let error: string | null = null;
  export let required: boolean = false;
  export let id: string = '';
</script>

<div class="form-group">
  {#if label}
    <label for={id} class="form-label">
      {label}
      {#if required}
        <span class="required-indicator">*</span>
      {/if}
    </label>
  {/if}
  <div class="form-input-wrapper">
    <slot />
  </div>
  {#if error}
    <div class="form-error">{error}</div>
  {/if}
</div>

<style>
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-label {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-primary);
    display: block;
  }

  /* Mobile: larger label font size */
  @media (max-width: 639px) {
    .form-label {
      font-size: var(--text-base);
    }
  }

  .required-indicator {
    color: var(--color-error);
    margin-left: 0.25rem;
  }

  .form-input-wrapper {
    width: 100%;
  }

  .form-error {
    font-size: var(--text-2xs);
    color: var(--color-error);
    margin-top: 0.25rem;
  }
</style>
