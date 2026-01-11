<script lang="ts">
  export let companions: any[] = [];
  export let excludeUserId: string | null = null;

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

  function shouldExcludeCompanion(comp: any): boolean {
    if (!excludeUserId) return false;
    const normalized = getNormalizedCompanion(comp);
    return normalized?.userId === excludeUserId;
  }

  function getFilteredCompanions(): any[] {
    return companions.filter(comp => !shouldExcludeCompanion(comp));
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

  function sortCompanions(comps: any[]): any[] {
    // Sort in reverse alphabetical order by first name, then last name
    // (since flex-direction: row-reverse will flip the visual order)
    return [...comps].sort((a, b) => {
      const compA = getNormalizedCompanion(a);
      const compB = getNormalizedCompanion(b);

      if (!compA || !compB) return 0;

      const firstNameA = (compA.firstName || '').toLowerCase();
      const firstNameB = (compB.firstName || '').toLowerCase();

      // If first names are different, sort by first name (reverse)
      if (firstNameA !== firstNameB) {
        return firstNameB.localeCompare(firstNameA);
      }

      // If first names are the same, sort by last name (reverse)
      const lastNameA = (compA.lastName || '').toLowerCase();
      const lastNameB = (compB.lastName || '').toLowerCase();
      return lastNameB.localeCompare(lastNameA);
    });
  }
</script>

<div class="companion-indicators">
  {#each sortCompanions(getFilteredCompanions()) as comp (getNormalizedCompanion(comp)?.id)}
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
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 0.45rem;
    font-weight: 700;
    border: 1.5px solid;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    padding: 1px 0 0 0.5px;
  }

  .companion-circle:first-child {
    margin-left: 0;
  }
</style>
