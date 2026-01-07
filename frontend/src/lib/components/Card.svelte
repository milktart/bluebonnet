<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let clickable: boolean = false;
</script>

<div class="card" class:clickable on:click>
  {#if title || subtitle || $$slots.indicators}
    <div class="card-header">
      <div class="header-content">
        {#if title}
          <h3>{title}</h3>
        {/if}
        {#if subtitle}
          <p class="subtitle">{subtitle}</p>
        {/if}
      </div>
      {#if $$slots.indicators}
        <div class="header-indicators">
          <slot name="indicators" />
        </div>
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
    padding: clamp(0.75rem, 3vw, 1.5rem);
  }

  .card.clickable {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .card.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .card.clickable:active {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
  }

  .card-header {
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: clamp(0.5rem, 2vw, 1rem);
    margin-bottom: clamp(0.5rem, 2vw, 1rem);
    padding-bottom: clamp(0.5rem, 2vw, 1rem);
  }

  .header-content {
    flex: 1;
    min-width: 0;
  }

  .card-header h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: clamp(1rem, 4vw, 1.25rem);
    word-break: break-word;
  }

  .card-header .subtitle {
    margin: 0;
    color: #666;
    font-size: clamp(0.75rem, 2vw, 0.9rem);
    word-break: break-word;
  }

  .header-indicators {
    padding: 0;
    flex-shrink: 0;
    display: flex;
    gap: 0.5rem;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 2vw, 0.75rem);
  }

  .card-footer {
    border-top: 1px solid #f0f0f0;
    background-color: #fafafa;
    padding-top: clamp(0.5rem, 2vw, 1rem);
    margin-top: clamp(0.5rem, 2vw, 1rem);
  }

  /* Mobile (0-479px) - Compact padding */
  @media (max-width: 479px) {
    .card {
      padding: 0.75rem;
      border-radius: 0.375rem;
    }

    .card-header h3 {
      font-size: 1rem;
    }

    .card-header .subtitle {
      font-size: 0.75rem;
    }
  }

  /* Tablet (640-1023px) - Balanced padding */
  @media (min-width: 640px) and (max-width: 1023px) {
    .card {
      padding: 1rem;
    }
  }

  /* Desktop (1024px+) - Generous padding */
  @media (min-width: 1024px) {
    .card {
      padding: 1.5rem;
    }

    .card.clickable:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
  }

  /* Landscape mode (short viewport) - Reduced padding */
  @media (max-height: 600px) {
    .card {
      padding: 0.5rem;
    }

    .card-header {
      margin-bottom: 0.25rem;
      padding-bottom: 0.25rem;
    }

    .card-header h3 {
      font-size: 0.875rem;
      margin-bottom: 0;
    }

    .card-footer {
      padding-top: 0.25rem;
      margin-top: 0.25rem;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) {
    .card.clickable {
      min-height: 48px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }

    .card.clickable:hover,
    .card.clickable:active {
      transform: none;
    }
  }
</style>
