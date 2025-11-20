/**
 * Companions Manager
 * Handles all companion list interactions for the sidebar
 */

// Attach global listeners once at page load
document.addEventListener('DOMContentLoaded', function () {
  attachCompanionsGlobalListener();
  attachCompanionsFormHandler();
});

function attachCompanionsFormHandler() {
  // Use event delegation for form submission
  document.addEventListener('submit', function (event) {
    const form = event.target;

    // Check if this is the edit companion form
    if (form.id === 'edit-companion-form') {
      event.preventDefault();

      const formData = new FormData(form);
      const { action } = form;

      // Convert FormData to object
      const data = Object.fromEntries(formData);

      // Send as POST with JSON (the form handles method override with _method=PUT)
      fetch(action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sidebar-Request': 'true',
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok && response.status !== 400) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            // Success - reload companions sidebar using standardized loader
            loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
          } else {
            alert(data.error || 'Failed to update companion');
          }
        })
        .catch((error) => {
          alert('Error updating companion. Please try again.');
        });
    }

    // Check if this is the create companion form
    if (form.id === 'create-companion-form') {
      event.preventDefault();

      const formData = new FormData(form);
      const { action } = form;

      // Convert FormData to object
      const data = Object.fromEntries(formData);

      // Send as POST with JSON
      fetch(action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sidebar-Request': 'true',
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok && response.status !== 400) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            // Success - reload companions sidebar using standardized loader
            loadSidebarContent('/account/companions-sidebar', { fullWidth: true });
          } else {
            alert(data.error || 'Failed to add companion');
          }
        })
        .catch((error) => {
          alert(`Error adding companion: ${error.message}`);
        });
    }
  });
}

function attachCompanionsGlobalListener() {
  document.addEventListener(
    'click',
    function (event) {
      const sidebarContent = document.getElementById('secondary-sidebar-content');
      if (!sidebarContent) return;

      // Menu toggle buttons
      const menuBtn = event.target.closest('[data-companion-menu-btn]');
      if (menuBtn) {
        event.stopPropagation();
        const companionId = menuBtn.dataset.companionMenuBtn;
        const menu = sidebarContent.querySelector(`[data-companion-menu="${companionId}"]`);
        if (menu) {
          // Close other menus
          sidebarContent.querySelectorAll('[data-companion-menu]').forEach((m) => {
            if (m !== menu) m.classList.add('hidden');
          });
          menu.classList.toggle('hidden');
        }
        return;
      }

      // Edit button
      const editBtn = event.target.closest('[data-companion-edit]');
      if (editBtn) {
        event.stopPropagation();
        const companionId = editBtn.dataset.companionEdit;
        loadSidebarContent(`/companions/${companionId}/sidebar/edit`);
        return;
      }

      // Delete button
      const deleteBtn = event.target.closest('[data-companion-delete]');
      if (deleteBtn) {
        event.stopPropagation();
        const companionId = deleteBtn.dataset.companionDelete;
        if (
          confirm(
            'Are you sure you want to delete this travel companion? This will remove them from all trips they are currently part of.'
          )
        ) {
          performDeleteCompanion(companionId);
        }
        return;
      }

      // Unlink button
      const unlinkBtn = event.target.closest('[data-companion-unlink]');
      if (unlinkBtn) {
        event.stopPropagation();
        const companionId = unlinkBtn.dataset.companionUnlink;
        if (
          confirm(
            "Are you sure you want to unlink this companion's account? They will no longer be able to see trips you've added them to until they are linked again."
          )
        ) {
          performUnlinkCompanion(companionId);
        }
        return;
      }

      // Permission toggle
      const permissionCheckbox = event.target.closest('[data-companion-permission]');
      if (permissionCheckbox) {
        const companionId = permissionCheckbox.dataset.companionPermission;
        toggleCompanionPermission(companionId, permissionCheckbox.checked);
        return;
      }

      // Close menus when clicking outside
      const isMenuBtn = event.target.closest('[data-companion-menu-btn]');
      if (!isMenuBtn && sidebarContent) {
        sidebarContent.querySelectorAll('[data-companion-menu]').forEach((menu) => {
          menu.classList.add('hidden');
        });
      }
    },
    true
  ); // Use capture phase for better event handling
}

// Initialize companions list (now just a placeholder since global listener handles it)
function initializeCompanionsList() {
  // Global listener is already attached, no need to attach per-list
}

async function performDeleteCompanion(companionId) {
  try {
    const response = await fetch(`/companions/${companionId}`, {
      method: 'DELETE',
      headers: {
        'X-Sidebar-Request': 'true',
      },
    });

    if (!response.ok && response.status !== 404 && response.status !== 500) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Reload the sidebar content
      loadSidebarContent('/companions/sidebar');
    } else {
      alert(data.error || 'Failed to delete companion');
    }
  } catch (error) {
    alert(`Error deleting companion: ${error.message}`);
  }
}

async function performUnlinkCompanion(companionId) {
  try {
    const response = await fetch(`/companions/${companionId}/unlink`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Sidebar-Request': 'true',
      },
    });

    if (!response.ok && response.status !== 404 && response.status !== 500) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Reload the sidebar content
      loadSidebarContent('/companions/sidebar');
    } else {
      alert(data.error || 'Failed to unlink companion');
    }
  } catch (error) {
    alert(`Error unlinking companion: ${error.message}`);
  }
}

// Helper functions for edit form buttons
function unlinkCompanionAccount(companionId) {
  if (
    confirm(
      "Are you sure you want to unlink this companion's account? They will no longer be able to see trips you've added them to until they are linked again."
    )
  ) {
    performUnlinkCompanion(companionId);
  }
}

function deleteCompanionSidebar(companionId) {
  if (
    confirm(
      'Are you sure you want to delete this travel companion? This will remove them from all trips they are currently part of. This action cannot be undone.'
    )
  ) {
    performDeleteCompanion(companionId);
  }
}

async function toggleCompanionPermission(companionId, canBeAddedByOthers) {
  try {
    const response = await fetch(`/companions/${companionId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Sidebar-Request': 'true',
      },
      body: JSON.stringify({ canBeAddedByOthers }),
    });

    if (!response.ok && response.status !== 404 && response.status !== 500) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      alert(data.error || 'Failed to update companion permissions');
      // Reload to revert the checkbox
      loadSidebarContent('/companions/sidebar');
    }
  } catch (error) {
    alert(`Error updating companion permissions: ${error.message}`);
    // Reload to revert the checkbox
    loadSidebarContent('/companions/sidebar');
  }
}
