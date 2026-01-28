/**
 * useCompanionAvatars Composable
 * Reusable avatar color and initials display logic
 * Used by: ItemCompanionsSelector
 *
 * Eliminates ~40 LOC of duplicate avatar logic
 */

import { getCompanionInitials } from '$lib/utils/companionFormatter';

/**
 * Get a consistent color for a companion based on email hash
 * Ensures same email always gets same color
 */
export function getAvatarColor(email: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B88B', '#A9CCE3'
  ];

  if (!email) return colors[0];

  // Hash email to consistent color index
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Prepare avatar display data for a companion
 */
export function getAvatarDisplay(companion: any) {
  const email = companion.email || companion.companion?.email || '';
  const initials = getCompanionInitials(companion);
  const color = getAvatarColor(email);

  return {
    initials,
    color,
    email
  };
}

/**
 * Create avatar style string for inline styling
 */
export function getAvatarStyle(companion: any): string {
  const { color } = getAvatarDisplay(companion);
  return `background-color: ${color};`;
}
