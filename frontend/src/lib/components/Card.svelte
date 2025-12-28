<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let clickable: boolean = false;
</script>

<div class="card" class:clickable on:click>
  {#if title || subtitle}
    <div class="card-header">
      {#if title}
        <h3>{title}</h3>
      {/if}
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
    </div>
  {/if}

  <div class="card-body">
    <slot />
  </div>

  {#if $$slots.footer}
    <div class="card-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    background: #ffffff90;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .card.clickable {
    cursor: pointer;
  }

  .card.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .card-header {
    border-bottom: 1px solid #f0f0f0;
  }

  .card-header h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.25rem;
  }

  .card-header .subtitle {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .card-body {
  }

  .card-footer {
    border-top: 1px solid #f0f0f0;
    background-color: #fafafa;
  }
</style>
