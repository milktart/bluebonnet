<script lang="ts">
  type AlertType = 'success' | 'error' | 'warning' | 'info';

  export let type: AlertType = 'info';
  export let title: string = '';
  export let message: string;
  export let dismissible: boolean = false;

  let visible = true;

  function handleDismiss() {
    visible = false;
  }
</script>

{#if visible}
  <div class="alert alert-{type}">
    <div class="alert-content">
      {#if title}
        <strong>{title}</strong>
      {/if}
      <p>{message}</p>
    </div>
    {#if dismissible}
      <button class="alert-close" on:click={handleDismiss}>
        <span aria-label="Close">×</span>
      </button>
    {/if}
  </div>
{/if}

<style>
  .alert {
    padding: 1rem;
    border-radius: 4px;
    border-left: 4px solid;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .alert-content {
    flex: 1;
  }

  .alert-content strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .alert-content p {
    margin: 0;
    font-size: 0.95rem;
  }

  /* Success variant */
  .alert-success {
    background-color: #d4edda;
    border-color: #28a745;
    color: #155724;
  }

  /* Error variant */
  .alert-error {
    background-color: #f8d7da;
    border-color: #dc3545;
    color: #721c24;
  }

  /* Warning variant */
  .alert-warning {
    background-color: #fff3cd;
    border-color: #ffc107;
    color: #856404;
  }

  /* Info variant */
  .alert-info {
    background-color: #d1ecf1;
    border-color: #17a2b8;
    color: #0c5460;
  }

  .alert-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .alert-close:hover {
    opacity: 1;
  }
</style>
