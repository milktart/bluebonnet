/**
 * Companion Badge Display Helper
 *
 * Provides consistent companion data preparation for CompanionIndicators component.
 * Handles normalization, sorting, and filtering of companion arrays across the application.
 *
 * Single source of truth for:
 * - Companion data normalization (handles both nested and direct formats)
 * - Sorting order (owner first if applicable, then alphabetically by first name)
 * - Filtering (excluding current user)
 */

/**
 * Normalize companion object to handle both nested (tc.companion) and direct formats
 * @param companion - Raw companion object that may have nested structure
 * @returns Normalized companion object or null
 */
function normalizeCompanion(companion: any): any {
  if (!companion) return null;

  // If it has a nested companion property, extract it
  if (companion.companion) {
    return companion.companion;
  }

  // Otherwise, use the object directly
  return companion;
}

/**
 * Get the user ID from a companion object, handling both formats
 * @param companion - Companion object (normalized or raw)
 * @returns User ID or null
 */
function getCompanionUserId(companion: any): string | null {
  if (!companion) return null;

  const normalized = normalizeCompanion(companion);
  if (!normalized) return null;

  // Check userId on the normalized companion, or on the linkedAccount
  return normalized.userId || normalized.linkedAccount?.id || null;
}

/**
 * Prepare companion array for display in badge indicators
 *
 * Handles:
 * - Normalization of companion data format
 * - Sorting with owner first (if identified), then alphabetically
 * - Filtering to exclude current user
 *
 * @param companions - Array of companion objects to prepare
 * @param currentUserId - Current user's ID (to exclude from display)
 * @param ownerUserId - Optional: ID of the item/trip owner (will be sorted first)
 * @returns Prepared array of companions ready for CompanionIndicators
 */
export function getCompanionBadges(
  companions: any[] = [],
  currentUserId: string | null = null,
  ownerUserId: string | null = null
): any[] {
  if (!Array.isArray(companions) || companions.length === 0) {
    return [];
  }

  // Filter companions
  let filtered = companions.filter((comp) => {
    const userId = getCompanionUserId(comp);
    // Exclude current user if provided
    return !currentUserId || userId !== currentUserId;
  });

  if (filtered.length === 0) {
    return [];
  }

  // Sort companions: owner first (if ownerUserId provided), then alphabetically
  const sorted = [...filtered].sort((a, b) => {
    const userIdA = getCompanionUserId(a);
    const userIdB = getCompanionUserId(b);

    const normalizedA = normalizeCompanion(a);
    const normalizedB = normalizeCompanion(b);

    // If owner is specified, place owner first
    if (ownerUserId) {
      if (userIdA === ownerUserId && userIdB !== ownerUserId) return -1;
      if (userIdA !== ownerUserId && userIdB === ownerUserId) return 1;
    }

    // Then sort alphabetically by first name
    const firstNameA = (normalizedA?.firstName || '').toLowerCase();
    const firstNameB = (normalizedB?.firstName || '').toLowerCase();

    if (firstNameA !== firstNameB) {
      return firstNameA.localeCompare(firstNameB);
    }

    // If first names are same, sort by last name
    const lastNameA = (normalizedA?.lastName || '').toLowerCase();
    const lastNameB = (normalizedB?.lastName || '').toLowerCase();

    return lastNameA.localeCompare(lastNameB);
  });

  return sorted;
}

/**
 * Get display name for a companion
 * @param companion - Companion object
 * @returns Display name (firstName lastName, firstName, or email)
 */
export function getCompanionDisplayName(companion: any): string {
  const normalized = normalizeCompanion(companion);
  if (!normalized) return '';

  if (normalized.firstName && normalized.lastName) {
    return `${normalized.firstName} ${normalized.lastName}`;
  }
  if (normalized.firstName) {
    return normalized.firstName;
  }
  if (normalized.lastName) {
    return normalized.lastName;
  }
  if (normalized.name) {
    return normalized.name;
  }
  return normalized.email || '';
}

/**
 * Check if a companion is the owner of an item/trip
 * @param companion - Companion object to check
 * @param ownerUserId - User ID of the owner
 * @returns true if companion is the owner
 */
export function isCompanionOwner(companion: any, ownerUserId: string | null): boolean {
  if (!ownerUserId) return false;
  const userId = getCompanionUserId(companion);
  return userId === ownerUserId;
}
