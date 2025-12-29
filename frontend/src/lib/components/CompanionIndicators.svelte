<script lang="ts">
  export let companions: any[] = [];

  function getInitials(email: string): string {
    if (!email) return '?';
    // Get first letter of email
    return email.charAt(0).toUpperCase();
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
  {#each companions as companion (companion.id)}
    <div
      class="companion-circle"
      style="background-color: {getColorForInitial(getInitials(companion.email))}"
      title={companion.email}
    >
      {getInitials(companion.email)}
    </div>
  {/each}
</div>

<style>
  .companion-indicators {
    display: flex;
    gap: -4px;
    flex-direction: row-reverse;
    align-items: center;
  }

  .companion-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: bold;
    color: white;
    border: 2px solid white;
    margin-left: -8px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .companion-circle:hover {
    transform: scale(1.1);
    z-index: 10;
    margin-left: 0;
  }

  .companion-circle:first-child {
    margin-left: 0;
  }
</style>
