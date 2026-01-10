<script lang="ts">
  import { onMount } from 'svelte';
  import { companionsApi, attendeesApi } from '$lib/services/api';
  import Alert from './Alert.svelte';

  export let tripId: string;
  export let attendees: any[] = [];
  export let userRole: string = 'attendee';
  export let onAttendeesUpdate: ((attendees: any[]) => void) | null = null;

  let newAttendeeEmail = '';
  let newAttendeeName = '';
  let newAttendeeRole = 'attendee';
  let loading = false;
  let error: string | null = null;
  let companionList: any[] = [];
  let loadingCompanions = true;

  // Load all companions on component mount
  async function loadCompanions() {
    try {
      loadingCompanions = true;
      const response = await companionsApi.getAll();
      companionList = Array.isArray(response) ? response : (response?.data || []);
    } catch (err) {
      console.error('Failed to load companions:', err);
      companionList = [];
    } finally {
      loadingCompanions = false;
    }
  }

  // Load companions when component mounts
  onMount(() => {
    loadCompanions();
  });

  function getCompanionDisplayName(comp: any): string {
    if (comp.firstName && comp.lastName) {
      return `${comp.firstName} ${comp.lastName}`;
    } else if (comp.firstName) {
      return comp.firstName;
    } else if (comp.lastName) {
      return comp.lastName;
    }
    return comp.email;
  }

  async function handleAddAttendee() {
    if (!newAttendeeEmail.trim() || !newAttendeeName.trim()) {
      error = 'Email and name are required';
      return;
    }

    try {
      loading = true;
      error = null;

      const newAttendee = await attendeesApi.add(
        tripId,
        newAttendeeEmail.trim(),
        newAttendeeName.trim(),
        newAttendeeRole
      );

      attendees = [...attendees, newAttendee];

      if (onAttendeesUpdate) {
        onAttendeesUpdate(attendees);
      }

      // Reset form
      newAttendeeEmail = '';
      newAttendeeName = '';
      newAttendeeRole = 'attendee';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add attendee';
      error = errorMsg;
      console.error('[TripAttendeesForm] Error adding attendee:', err);
    } finally {
      loading = false;
    }
  }

  async function handleQuickAddFromCompanion(companion: any) {
    try {
      loading = true;
      error = null;

      const newAttendee = await attendeesApi.add(
        tripId,
        companion.email,
        companion.name || getCompanionDisplayName(companion),
        'attendee'
      );

      attendees = [...attendees, newAttendee];

      if (onAttendeesUpdate) {
        onAttendeesUpdate(attendees);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add attendee';
      error = errorMsg;
      console.error('[TripAttendeesForm] Error adding attendee from companion:', err);
    } finally {
      loading = false;
    }
  }

  async function handleRemoveAttendee(attendeeId: string) {
    try {
      loading = true;
      error = null;

      await attendeesApi.remove(tripId, attendeeId);

      attendees = attendees.filter((a) => a.id !== attendeeId);

      if (onAttendeesUpdate) {
        onAttendeesUpdate(attendees);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to remove attendee';
      console.error('[TripAttendeesForm] Error removing attendee:', err);
    } finally {
      loading = false;
    }
  }

  async function handleUpdateRole(attendeeId: string, newRole: string) {
    try {
      loading = true;
      error = null;

      await attendeesApi.updateRole(tripId, attendeeId, newRole);

      const attendeeIndex = attendees.findIndex((a) => a.id === attendeeId);
      if (attendeeIndex !== -1) {
        attendees[attendeeIndex].role = newRole;
        attendees = attendees;

        if (onAttendeesUpdate) {
          onAttendeesUpdate(attendees);
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update role';
      console.error('[TripAttendeesForm] Error updating attendee role:', err);
    } finally {
      loading = false;
    }
  }

  function getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      owner: 'Owner',
      admin: 'Admin',
      attendee: 'Attendee',
    };
    return labels[role] || role;
  }

  function canManageAttendees(): boolean {
    return userRole === 'owner' || userRole === 'admin';
  }

  function canChangeRoles(): boolean {
    return userRole === 'owner';
  }
</script>

<div class="trip-attendees-form">
  <h4 class="section-title">Trip Attendees</h4>

  {#if error}
    <Alert type="error" message={error} dismissible />
  {/if}

  <!-- Add Attendee Section (only for admins) -->
  {#if canManageAttendees()}
    <div class="add-attendee-section">
      <div class="form-group">
        <input
          type="email"
          placeholder="Email address"
          bind:value={newAttendeeEmail}
          disabled={loading}
          class="form-input"
        />
      </div>
      <div class="form-group">
        <input
          type="text"
          placeholder="Full name"
          bind:value={newAttendeeName}
          disabled={loading}
          class="form-input"
        />
      </div>
      <div class="form-group">
        <select bind:value={newAttendeeRole} disabled={loading} class="form-select">
          <option value="attendee">Attendee</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        on:click={handleAddAttendee}
        disabled={loading || !newAttendeeEmail.trim() || !newAttendeeName.trim()}
        class="add-btn"
      >
        Add Attendee
      </button>

      {#if companionList.length > 0 && !loadingCompanions}
        <div class="quick-add-section">
          <p class="quick-add-label">Quick add from companions:</p>
          <div class="quick-add-buttons">
            {#each companionList as companion (companion.id)}
              <button
                on:click={() => handleQuickAddFromCompanion(companion)}
                disabled={loading}
                class="quick-add-btn"
                title={`Add ${getCompanionDisplayName(companion)}`}
              >
                {getCompanionDisplayName(companion)}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Attendees List -->
  {#if attendees && attendees.length > 0}
    <div class="attendees-list">
      <div class="list-header">
        <span>Name</span>
        <span class="role-col">Role</span>
        {#if canManageAttendees()}
          <span class="action-col"></span>
        {/if}
      </div>
      {#each attendees as attendee (attendee.id)}
        <div class="attendee-item">
          <div class="attendee-info">
            <div class="attendee-name">{attendee.name || attendee.email}</div>
            <div class="attendee-email">{attendee.email}</div>
          </div>
          <div class="role-cell">
            {#if canChangeRoles() && attendee.role !== 'owner'}
              <select
                value={attendee.role}
                on:change={(e) => handleUpdateRole(attendee.id, e.currentTarget.value)}
                disabled={loading}
                class="role-select"
              >
                <option value="attendee">Attendee</option>
                <option value="admin">Admin</option>
              </select>
            {:else}
              <span class="role-badge role-{attendee.role}">{getRoleLabel(attendee.role)}</span>
            {/if}
          </div>
          {#if canManageAttendees() && attendee.role !== 'owner'}
            <button
              class="remove-btn"
              on:click={() => handleRemoveAttendee(attendee.id)}
              disabled={loading}
              title="Remove attendee"
            >
              ✕
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="no-attendees">No attendees added yet</p>
  {/if}
</div>

<style>
  .trip-attendees-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }

  .section-title {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .add-attendee-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.425rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-input,
  .form-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    font-size: 0.8rem;
    color: #111827;
    background-color: #ffffff;
    font-family: inherit;
    box-sizing: border-box;
    height: 2.25rem;
    transition: all 0.15s;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled,
  .form-select:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .add-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.425rem;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    height: 2.25rem;
  }

  .add-btn:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .add-btn:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }

  .quick-add-section {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding-top: 0.5rem;
    border-top: 1px solid #d1d5db;
  }

  .quick-add-label {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
  }

  .quick-add-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .quick-add-btn {
    padding: 0.375rem 0.75rem;
    background-color: #e5e7eb;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .quick-add-btn:hover:not(:disabled) {
    background-color: #d1d5db;
  }

  .quick-add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .attendees-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid #d1d5db;
    border-radius: 0.425rem;
    overflow: hidden;
  }

  .list-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #d1d5db;
    font-size: 0.7rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    background-color: #f9fafb;
    box-sizing: border-box;
  }

  .role-col {
    text-align: center;
    min-width: 70px;
  }

  .action-col {
    width: 32px;
  }

  .attendee-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    align-items: center;
    background-color: #ffffff;
    transition: background-color 0.15s;
    box-sizing: border-box;
  }

  .attendee-item:last-child {
    border-bottom: none;
  }

  .attendee-item:hover {
    background-color: #f9fafb;
  }

  .attendee-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .attendee-name {
    font-size: 0.8rem;
    color: #111827;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attendee-email {
    font-size: 0.7rem;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 100px;
  }

  .role-select {
    padding: 0.375rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.325rem;
    font-size: 0.75rem;
    color: #111827;
    background-color: #ffffff;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .role-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .role-select:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  .role-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.325rem;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .role-owner {
    background-color: #fef3c7;
    color: #92400e;
  }

  .role-admin {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .role-attendee {
    background-color: #dcfce7;
    color: #166534;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    transition: color 0.15s;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.325rem;
  }

  .remove-btn:hover:not(:disabled) {
    color: #ef4444;
    background-color: #fef2f2;
  }

  .remove-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .no-attendees {
    margin: 0;
    color: #9ca3af;
    font-size: 0.8rem;
    text-align: center;
    padding: 1rem 0.75rem;
    background-color: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 0.425rem;
  }
</style>
