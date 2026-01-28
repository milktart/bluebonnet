/**
 * Companion Formatter Utility
 * Consolidated utilities for companion data formatting across the frontend
 *
 * This file consolidates:
 * - companionSortingUtil.ts (sortCompanions)
 * - companionBadgeHelper.ts (all display/formatting functions)
 *
 * Single source of truth for:
 * - Companion data normalization (handles both nested and direct formats)
 * - Sorting order (owner first, then alphabetically)
 * - Display name generation
 * - Initials calculation
 * - Permission/ownership checking
 */

export interface CompanionData {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  userId?: string;
  companion?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    userId?: string;
  };
}

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
 * Extract first name from companion object (flexible structure)
 */
function getFirstName(comp: CompanionData): string {
  const data = comp.companion || comp;
  return data.firstName || (data.name ? data.name.split(' ')[0] : '');
}

/**
 * Extract last name from companion object (flexible structure)
 */
function getLastName(comp: CompanionData): string {
  const data = comp.companion || comp;
  return data.lastName || '';
}

/**
 * Extract userId from companion object (flexible structure)
 */
function getUserId(comp: CompanionData): string | undefined {
  const data = comp.companion || comp;
  return data.userId;
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
 * Sort companions with owner first, then alphabetically by first name
 * @param comps - Array of companions to sort
 * @param ownerId - Optional user ID of the owner (comes first)
 * @returns Sorted array with owner first (if specified), then alphabetically
 */
export function sortCompanions(comps: CompanionData[], ownerId?: string): CompanionData[] {
  const sorted = [...comps].sort((a, b) => {
    const aUserId = getUserId(a);
    const bUserId = getUserId(b);

    // Owner comes first (if specified)
    if (ownerId) {
      if (aUserId === ownerId && bUserId !== ownerId) return -1;
      if (aUserId !== ownerId && bUserId === ownerId) return 1;
    }

    // Then sort alphabetically by first name, then last name
    const aFirstName = getFirstName(a).toLowerCase();
    const bFirstName = getFirstName(b).toLowerCase();
    const aLastName = getLastName(a).toLowerCase();
    const bLastName = getLastName(b).toLowerCase();

    if (aFirstName !== bFirstName) {
      return aFirstName.localeCompare(bFirstName);
    }

    return aLastName.localeCompare(bLastName);
  });

  return sorted;
}

/**
 * Get display name for a companion
 * Prioritizes firstName + lastName, falls back to name field, then email
 *
 * @param companion - Companion object
 * @param isCurrentUser - Optional: append "(me)" to current user's display
 * @returns Display name (firstName lastName, firstName, lastName, name, or email)
 */
export function getCompanionDisplayName(companion: any, isCurrentUser: boolean = false): string {
  const normalized = normalizeCompanion(companion);
  if (!normalized) return '';

  let name = '';
  if (normalized.firstName && normalized.lastName) {
    name = `${normalized.firstName} ${normalized.lastName}`;
  } else if (normalized.firstName) {
    name = normalized.firstName;
  } else if (normalized.lastName) {
    name = normalized.lastName;
  } else if (normalized.name) {
    name = normalized.name;
  } else {
    name = normalized.email || '';
  }

  if (isCurrentUser) {
    return `${name} (me)`;
  }
  return name;
}

/**
 * Get the email from a companion object
 * @param companion - Companion object
 * @returns Email address or empty string
 */
export function getCompanionEmail(companion: any): string {
  const normalized = normalizeCompanion(companion);
  return normalized?.email || '';
}

/**
 * Get initials for a companion badge
 * Returns 1-2 character initials based on available name data
 * @param companion - Companion object
 * @returns 1-2 character initials (or '?' if no data)
 */
export function getCompanionInitials(companion: any): string {
  const normalized = normalizeCompanion(companion);
  if (!normalized) return '?';

  const email = normalized.email || '';
  if (!email) return '?';

  // Prefer firstName/lastName combination if both exist
  if (normalized.firstName && normalized.lastName) {
    return (normalized.firstName[0] + normalized.lastName[0]).toUpperCase();
  }

  // If only firstName exists, use first letter
  if (normalized.firstName) {
    return normalized.firstName[0].toUpperCase();
  }

  // If only lastName exists, use first letter
  if (normalized.lastName) {
    return normalized.lastName[0].toUpperCase();
  }

  // Fall back to name field if it exists
  if (normalized.name) {
    const parts = normalized.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  // Last resort: use first two letters of email
  return email.substring(0, 2).toUpperCase();
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

/**
 * Prepare companion array for display
 *
 * Handles:
 * - Normalization of companion data format
 * - Sorting with owner first (if identified), then alphabetically
 * - Filtering to exclude current user
 *
 * @param companions - Array of companion objects to prepare
 * @param currentUserId - Current user's ID (to exclude from display)
 * @param ownerUserId - Optional: ID of the item/trip owner (will be sorted first)
 * @returns Prepared array of companions ready for display
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

  // Sort companions using shared sorting utility
  return sortCompanions(filtered, ownerUserId);
}

/**
 * Search companions by query string
 * @param companions - Array of companions to search
 * @param query - Search query string
 * @returns Filtered array of companions matching the query
 */
export function searchCompanions(companions: CompanionData[], query: string): CompanionData[] {
  if (!query || query.trim().length === 0) {
    return companions;
  }

  const lowerQuery = query.toLowerCase();
  return companions.filter((comp) => {
    const name = getCompanionDisplayName(comp).toLowerCase();
    const email = getCompanionEmail(comp).toLowerCase();
    return name.includes(lowerQuery) || email.includes(lowerQuery);
  });
}
