<script lang="ts">
  type ModalSize = 'sm' | 'md' | 'lg';

  export let open: boolean = false;
  export let title: string = '';
  export let size: ModalSize = 'md';
  export let onClose: () => void = () => {};
</script>

{#if open}
  <div class="modal-backdrop" on:click={onClose}>
    <div class="modal modal-{size}" on:click|stopPropagation>
      {#if title}
        <div class="modal-header">
          <h2 class="modal-title">{title}</h2>
          <button class="modal-close" on:click={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>
      {/if}
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal-backdrop);
    padding: var(--spacing-md);
  }

  .modal {
    background-color: var(--color-bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-modal);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    max-width: 100%;
  }

  /* Size variants */
  .modal-sm {
    width: 100%;
    max-width: 400px;
  }

  .modal-md {
    width: 100%;
    max-width: 600px;
  }

  .modal-lg {
    width: 100%;
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    gap: var(--spacing-md);
  }

  .modal-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: all 0.15s ease-in-out;
    flex-shrink: 0;
  }

  .modal-close:hover {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: var(--spacing-lg);
    overflow-y: auto;
    flex: 1;
  }

  /* Mobile adjustments */
  @media (max-width: 639px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal {
      width: 100%;
      max-width: 100%;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      margin-bottom: 0;
    }

    .modal-sm,
    .modal-md,
    .modal-lg {
      max-width: 100%;
    }
  }
</style>
