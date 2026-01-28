/**
 * Companion Type Definitions
 * Comprehensive type safety for companion operations
 */

export interface CompanionData {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  userId?: string;
  createdBy: string;
  createdAt?: Date;
  linkedAccount?: LinkedAccountData;
  permissions?: CompanionPermissionData[];
}

export interface LinkedAccountData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export interface CompanionPermissionData {
  id: string;
  companionId: string;
  tripId?: string;
  itemId?: string;
  canView: boolean;
  canEdit: boolean;
  canManageCompanions: boolean;
  grantedBy: string;
  grantedAt?: Date;
}

export interface CreateCompanionRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  linkedUserId?: string;
}

export interface UpdateCompanionRequest {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  userId?: string | null;
}

export interface PermissionUpdate {
  canView?: boolean;
  canEdit?: boolean;
  canManageCompanions?: boolean;
}

export interface CompanionPermissionRequest {
  companionId: string;
  tripId?: string;
  itemId?: string;
  permissions: PermissionUpdate;
}
