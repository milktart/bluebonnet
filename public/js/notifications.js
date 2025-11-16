/**
 * Notification Center
 * Unified notification handling for dashboard and nav
 */

let notificationPollInterval = null;
let notificationPanelOpen = false;

/**
 * Toggle notification center panel visibility
 * @param {string} panelId - ID of the notification panel element
 * @param {string} bellId - ID of the bell button element
 */
function toggleNotificationCenter(panelId = 'notification-panel', bellId = 'notification-bell') {
  const panel = document.getElementById(panelId);
  if (!panel) {
    console.error(`Notification panel #${panelId} not found`);
    return;
  }

  notificationPanelOpen = !notificationPanelOpen;

  if (notificationPanelOpen) {
    panel.style.display = 'block';
    loadNotifications(panelId);
    // Start polling for new notifications every 30 seconds
    if (notificationPollInterval) clearInterval(notificationPollInterval);
    notificationPollInterval = setInterval(() => loadNotifications(panelId), 30000);
  } else {
    panel.style.display = 'none';
    if (notificationPollInterval) clearInterval(notificationPollInterval);
  }
}

/**
 * Setup click outside handler to close notification panel
 * @param {string} panelId - ID of the notification panel element
 * @param {string} bellId - ID of the bell button element
 */
function setupNotificationClickOutside(panelId = 'notification-panel', bellId = 'notification-bell') {
  document.addEventListener('click', (e) => {
    const panel = document.getElementById(panelId);
    const bell = document.getElementById(bellId);

    if (!panel || !bell) return;

    if (!panel.contains(e.target) && e.target !== bell && !bell.contains(e.target)) {
      if (notificationPanelOpen) {
        toggleNotificationCenter(panelId, bellId);
      }
    }
  });
}

/**
 * Load notifications from server and update UI
 * @param {string} panelId - ID of the notification panel element
 */
async function loadNotifications(panelId = 'notification-panel') {
  try {
    // Determine badge and list IDs based on panel ID
    const badgeId = panelId.includes('dashboard') ? 'dashboard-notification-badge' : 'notification-badge';
    const countId = panelId.includes('dashboard') ? 'dashboard-unread-count' : 'unread-count';
    const listId = panelId.includes('dashboard') ? 'dashboard-notification-list' : 'notification-list';

    // Fetch unread count
    const countRes = await fetch('/notifications/count/unread');
    const countData = await countRes.json();
    updateBadge(countData.unreadCount, badgeId, countId);

    // Fetch notifications
    const notifRes = await fetch('/notifications?limit=10');
    const notifData = await notifRes.json();

    if (notifData.success) {
      renderNotifications(notifData.notifications || [], listId);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

/**
 * Update notification badge with unread count
 * @param {number} count - Number of unread notifications
 * @param {string} badgeId - ID of the badge element
 * @param {string} countId - ID of the count span element
 */
function updateBadge(count, badgeId = 'notification-badge', countId = 'unread-count') {
  const badge = document.getElementById(badgeId);
  const countSpan = document.getElementById(countId);

  if (!badge || !countSpan) return;

  if (count > 0) {
    badge.style.display = 'flex';
    countSpan.textContent = count > 99 ? '99+' : count;
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Render notifications in the list
 * @param {Array} notifications - Array of notification objects
 * @param {string} listId - ID of the list container element
 */
function renderNotifications(notifications, listId = 'notification-list') {
  const listContainer = document.getElementById(listId);
  if (!listContainer) {
    console.error(`Notification list #${listId} not found`);
    return;
  }

  if (!notifications || notifications.length === 0) {
    listContainer.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No notifications</div>';
    return;
  }

  listContainer.innerHTML = notifications.map(notif => {
    const isUnread = !notif.read;
    const bgClass = isUnread ? 'bg-blue-50' : 'bg-white';
    const timeAgo = getRelativeTime(notif.createdAt);

    let actionButtons = '';

    // Handle different notification types
    if (notif.type === 'companion_request_received') {
      actionButtons = `
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm btn-success flex-1" onclick="handleCompanionAction('${notif.id}', '${notif.relatedId}', 'accept')">
            <i class="bi bi-check"></i> Accept
          </button>
          <button class="btn btn-sm btn-outline-danger flex-1" onclick="handleCompanionAction('${notif.id}', '${notif.relatedId}', 'decline')">
            <i class="bi bi-x"></i> Decline
          </button>
        </div>
      `;
    } else if (notif.type === 'trip_invitation_received') {
      actionButtons = `
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm btn-primary flex-1" onclick="handleTripAction('${notif.id}', '${notif.relatedId}', 'join')">
            <i class="bi bi-check"></i> Join
          </button>
          <button class="btn btn-sm btn-outline-danger flex-1" onclick="handleTripAction('${notif.id}', '${notif.relatedId}', 'decline')">
            <i class="bi bi-x"></i> Decline
          </button>
        </div>
      `;
    }

    return `
      <div class="${bgClass} p-3 hover:bg-gray-50 cursor-pointer transition-colors" onclick="markNotificationAsRead('${notif.id}')">
        <div class="flex justify-between items-start mb-1">
          <p class="text-sm font-medium text-gray-900">${notif.message}</p>
          <button
            class="text-gray-400 hover:text-gray-600 ml-2"
            onclick="deleteNotification('${notif.id}'); event.stopPropagation();"
          >
            ×
          </button>
        </div>
        <p class="text-xs text-gray-500">${timeAgo}</p>
        ${actionButtons}
      </div>
    `;
  }).join('');
}

/**
 * Get relative time string from date
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return date.toLocaleDateString();
}

/**
 * Mark notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 */
async function markNotificationAsRead(notificationId) {
  try {
    await fetch(`/notifications/${notificationId}/read`, { method: 'PUT' });

    // Reload notifications for all open panels
    const dashboardPanel = document.getElementById('dashboard-notification-panel');
    const navPanel = document.getElementById('notification-panel');

    if (dashboardPanel && dashboardPanel.style.display !== 'none') {
      loadNotifications('dashboard-notification-panel');
    }
    if (navPanel && navPanel.style.display !== 'none') {
      loadNotifications('notification-panel');
    }

    // Always update badge counts
    const countRes = await fetch('/notifications/count/unread');
    const countData = await countRes.json();
    updateBadge(countData.unreadCount, 'notification-badge', 'unread-count');
    updateBadge(countData.unreadCount, 'dashboard-notification-badge', 'dashboard-unread-count');
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Delete notification
 * @param {string} notificationId - ID of the notification to delete
 */
async function deleteNotification(notificationId) {
  try {
    await fetch(`/notifications/${notificationId}`, { method: 'DELETE' });

    // Reload notifications for all open panels
    const dashboardPanel = document.getElementById('dashboard-notification-panel');
    const navPanel = document.getElementById('notification-panel');

    if (dashboardPanel && dashboardPanel.style.display !== 'none') {
      loadNotifications('dashboard-notification-panel');
    }
    if (navPanel && navPanel.style.display !== 'none') {
      loadNotifications('notification-panel');
    }

    // Always update badge counts
    const countRes = await fetch('/notifications/count/unread');
    const countData = await countRes.json();
    updateBadge(countData.unreadCount, 'notification-badge', 'unread-count');
    updateBadge(countData.unreadCount, 'dashboard-notification-badge', 'dashboard-unread-count');
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

/**
 * Handle companion request action (accept/decline)
 * @param {string} notificationId - ID of the notification
 * @param {string} relationshipId - ID of the companion relationship
 * @param {string} action - Action to take ('accept' or 'decline')
 */
async function handleCompanionAction(notificationId, relationshipId, action) {
  try {
    const endpoint = action === 'accept' ? 'accept' : 'decline';
    const permissionLevel = action === 'accept' ? 'view_travel' : null;

    const response = await fetch(`/companion-relationships/${relationshipId}/${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionLevel })
    });

    if (response.ok) {
      await markNotificationAsRead(notificationId);
    }
  } catch (error) {
    console.error('Error handling companion action:', error);
  }
}

/**
 * Handle trip invitation action (join/decline)
 * @param {string} notificationId - ID of the notification
 * @param {string} invitationId - ID of the trip invitation
 * @param {string} action - Action to take ('join' or 'decline')
 */
async function handleTripAction(notificationId, invitationId, action) {
  try {
    const response = await fetch(`/trip-invitations/${invitationId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: action })
    });

    if (response.ok) {
      await markNotificationAsRead(notificationId);
      // Refresh page after joining/declining a trip
      setTimeout(() => location.reload(), 500);
    }
  } catch (error) {
    console.error('Error handling trip action:', error);
  }
}

/**
 * Initialize notification system for a specific panel
 * @param {string} panelId - ID of the notification panel element
 * @param {string} bellId - ID of the bell button element
 */
function initializeNotifications(panelId = 'notification-panel', bellId = 'notification-bell') {
  // Setup click outside handler
  setupNotificationClickOutside(panelId, bellId);

  // Load initial notifications
  loadNotifications(panelId);

  // Make toggle function available globally with correct IDs
  window[`toggle_${panelId}`] = () => toggleNotificationCenter(panelId, bellId);
}

// ============================================================================
// EXPORTS
// ============================================================================

// ES6 Module exports
export {
  toggleNotificationCenter,
  loadNotifications,
  markNotificationAsRead,
  deleteNotification,
  handleCompanionAction,
  handleTripAction,
  initializeNotifications
};

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.toggleNotificationCenter = toggleNotificationCenter;
  window.loadNotifications = loadNotifications;
  window.markNotificationAsRead = markNotificationAsRead;
  window.deleteNotification = deleteNotification;
  window.handleCompanionAction = handleCompanionAction;
  window.handleTripAction = handleTripAction;
  window.initializeNotifications = initializeNotifications;
}
