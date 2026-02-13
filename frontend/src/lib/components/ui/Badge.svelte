<script lang="ts">
  type BadgeVariant = 'flight' | 'hotel' | 'event' | 'transportation' | 'car_rental' | 'voucher' | 'trip' | 'default';
  type BadgeSize = 'sm' | 'md' | 'lg';

  export let variant: BadgeVariant = 'default';
  export let size: BadgeSize = 'md';

  // Item type to badge color mapping
  const colorMap: Record<BadgeVariant, { bg: string; color: string }> = {
    flight: { bg: '#dbeafe', color: '#2563eb' },
    hotel: { bg: '#fce7f3', color: '#be185d' },
    event: { bg: '#fef3c7', color: '#d97706' },
    transportation: { bg: '#e0e7ff', color: '#4f46e5' },
    car_rental: { bg: '#d1fae5', color: '#0891b2' },
    voucher: { bg: '#f3e8ff', color: '#7c3aed' },
    trip: { bg: '#dbeafe', color: '#2563eb' },
    default: { bg: '#f3f4f6', color: '#6b7280' }
  };

  const colors = colorMap[variant];
</script>

<span class="badge" class:badge-{size} style="--badge-bg: {colors.bg}; --badge-color: {colors.color}">
  <slot />
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--badge-bg);
    color: var(--badge-color);
    border-radius: var(--radius-full);
    font-weight: 600;
    white-space: nowrap;
  }

  .badge-sm {
    padding: 0.25rem 0.75rem;
    font-size: var(--text-2xs);
    min-height: 20px;
  }

  .badge-md {
    padding: 0.375rem 0.75rem;
    font-size: var(--text-xs);
    min-height: 24px;
  }

  .badge-lg {
    padding: 0.5rem 1rem;
    font-size: var(--text-sm);
    min-height: 28px;
  }
</style>
