<script lang="ts">
  import CompanionsFormSection from './CompanionsFormSection.svelte';

  /**
   * ItemCompanionsForm - Wrapper around CompanionsFormSection for item-level companion management
   * Reuses CompanionsFormSection with item-specific permission logic
   */

  export let companions: any[] = [];
  export let canEdit: boolean = true;
  export let currentUserId: string | null = null;
  export let itemOwnerId: string | null = null;
  export let tripOwnerId: string | null = null;
  export let isStandaloneItem: boolean = false;
  export let onCompanionsUpdate: ((companions: any[]) => void) | null = null;
  export let onAddCompanion: ((companion: any) => Promise<any>) | null = null;
  export let onRemoveCompanion: ((companionId: string) => Promise<void>) | null = null;
  export let itemId: string = '';
  export let tripId: string | null = null;
</script>

<div class="item-companions-wrapper">
  <CompanionsFormSection
    type="item"
    entityId={itemId}
    {companions}
    {canEdit}
    {currentUserId}
    {itemOwnerId}
    {tripOwnerId}
    {isStandaloneItem}
    {tripId}
    {onCompanionsUpdate}
    {onAddCompanion}
    {onRemoveCompanion}
  />
</div>

<style>
  .item-companions-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
  }
</style>
