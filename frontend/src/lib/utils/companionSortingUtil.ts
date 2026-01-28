/**
 * Companion Sorting Utility
 * Shared sorting logic for companions in frontend
 *
 * Sorting strategy: context-aware owner first, then alphabetically by first name
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
