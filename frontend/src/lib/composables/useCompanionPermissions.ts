/**
 * useCompanionPermissions Composable
 * Reusable permission checking and toggle logic
 * Used by: CompanionsFormSection
 *
 * Eliminates ~40 LOC of complex permission logic
 * Centralizes permission hierarchy rules
 */

import { writable } from 'svelte/store';

interface PermissionSet {
  canView: boolean;
  canEdit: boolean;
  canManageCompanions: boolean;
}

interface UseCompanionPermissionsOptions {
  tripOwnerId?: string | null;
  itemOwnerId?: string | null;
  currentUserId?: string | null;
  isStandaloneItem?: boolean;
}

/**
 * Create reusable companion permissions composable
 * @param options - Configuration for permission context
 * @returns Object with permission checking functions
 */
export function useCompanionPermissions(options: UseCompanionPermissionsOptions = {}) {
  const permissionErrors = writable<Record<string, string>>({});

  /**
   * Check if a companion can be removed
   * - Trip owner can remove anyone
   * - Item owner can remove anyone
   * - Users can remove themselves (if added to item)
   */
  function canRemoveCompanion(companion: any, currentUserId: string | null): boolean {
    if (!currentUserId) return false;

    // Trip owner can always remove
    if (options.tripOwnerId === currentUserId) return true;

    // Item owner can always remove
    if (options.itemOwnerId === currentUserId) return true;

    // User can remove themselves
    // Handle both direct and nested companion structures
    let companionUserId = companion.userId || companion.linkedAccount?.id;
    if (!companionUserId && companion.companion) {
      companionUserId = companion.companion.userId || companion.companion.linkedAccount?.id;
    }
    if (companionUserId === currentUserId) return true;

    return false;
  }

  /**
   * Check if companion is the item owner
   */
  function isCompanionOwner(companion: any): boolean {
    if (!options.itemOwnerId) return false;
    const companionUserId = companion.userId || companion.linkedAccount?.id;
    return companionUserId === options.itemOwnerId;
  }

  /**
   * Check if companion is the trip owner
   */
  function isCompanionTripOwner(companion: any): boolean {
    if (!options.tripOwnerId) return false;
    const companionUserId = companion.userId || companion.linkedAccount?.id;
    return companionUserId === options.tripOwnerId;
  }

  /**
   * Get default permissions for a new companion in a trip context
   */
  function getDefaultTripPermissions(): PermissionSet {
    return {
      canView: true,
      canEdit: false,
      canManageCompanions: false
    };
  }

  /**
   * Get default permissions for a new companion in an item context
   * Standalone items are more permissive
   */
  function getDefaultItemPermissions(): PermissionSet {
    if (options.isStandaloneItem) {
      return {
        canView: true,
        canEdit: true,
        canManageCompanions: false
      };
    }

    // Item in trip inherits trip permissions
    return {
      canView: true,
      canEdit: false,
      canManageCompanions: false
    };
  }

  /**
   * Toggle a specific permission
   */
  function togglePermission(
    permissions: PermissionSet,
    permissionKey: keyof PermissionSet
  ): PermissionSet {
    return {
      ...permissions,
      [permissionKey]: !permissions[permissionKey]
    };
  }

  /**
   * Validate permission set (future: enforce hierarchy rules)
   */
  function validatePermissions(permissions: PermissionSet): boolean {
    // Could add rules like: canManageCompanions requires canEdit
    // For now, any combination is valid
    return true;
  }

  return {
    canRemoveCompanion,
    isCompanionOwner,
    isCompanionTripOwner,
    getDefaultTripPermissions,
    getDefaultItemPermissions,
    togglePermission,
    validatePermissions,
    permissionErrors
  };
}
