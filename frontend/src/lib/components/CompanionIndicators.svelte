<script lang="ts">
  export let companions: any[] = [];

  // Normalize companion object - handle both nested (tc.companion) and direct formats
  function getNormalizedCompanion(comp: any) {
    if (!comp) return null;
    // If it has a nested companion property, extract it
    if (comp.companion) {
      return comp.companion;
    }
    // Otherwise, use the object directly
    return comp;
  }

  function getInitials(email: string, name?: string, firstName?: string, lastName?: string): string {
    if (!email) return '?';

    // Build name from firstName/lastName if available
    let fullName = name;
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    // If we have a name, use first letter of first and last name
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }

    // Otherwise, use first two letters of email
    return email.substring(0, 2).toUpperCase();
  }

  function getColorForInitial(initial: string): string {
    // Use a consistent color based on the initial
    const colors = [
      '#FF6B6B', // red
      '#4ECDC4', // teal
      '#45B7D1', // blue
      '#FFA07A', // light salmon
      '#98D8C8', // mint
      '#F7DC6F', // yellow
      '#BB8FCE', // purple
      '#85C1E2', // light blue
      '#F8B88B', // peach
      '#A9CCE3'  // powder blue
    ];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
  }
</script>

<div class="companion-indicators">
  {#each companions as comp (getNormalizedCompanion(comp)?.id)}
    {@const companion = getNormalizedCompanion(comp)}
    {#if companion}
      {@const initials = getInitials(companion.email, companion.name, companion.firstName, companion.lastName)}
      {@const color = getColorForInitial(initials)}
      <div
        class="companion-circle"
        style="border-color: {color}; color: {color}"
        title={companion.email}
      >
        {initials}
      </div>
    {/if}
  {/each}
</div>

<style>
  .companion-indicators {
    display: flex;
    gap: 2px;
    flex-direction: row-reverse;
    align-items: center;
  }

  .companion-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 0.55rem;
    font-weight: 500;
    border: 1px solid;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .companion-circle:first-child {
    margin-left: 0;
  }
</style>
