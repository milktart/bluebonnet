<script lang="ts">
  export let open: boolean = false;
  export let title: string = '';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let onClose: (() => void) | null = null;

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleEscape} />

{#if open}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal modal-{size}">
      {#if title}
        <div class="modal-header">
          <h2>{title}</h2>
          {#if onClose}
            <button class="modal-close" on:click={onClose}>
              <span aria-label="Close">×</span>
            </button>
          {/if}
        </div>
      {/if}

      <div class="modal-body">
        <slot />
      </div>

      {#if $$slots.footer}
        <div class="modal-footer">
          <slot name="footer" />
        </div>
      {/if}
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
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .modal-small {
    width: 90%;
    max-width: 400px;
  }

  .modal-medium {
    width: 90%;
    max-width: 600px;
  }

  .modal-large {
    width: 90%;
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .modal-close:hover {
    opacity: 1;
  }

  .modal-body {
    padding: 1.5rem;
    flex: 1;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #f0f0f0;
    background-color: #fafafa;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
