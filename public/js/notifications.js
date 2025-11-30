/**
 * Notification System - Sidebar Integration
 * Handles WebSocket notifications and sidebar integration
 * Phase 4 - Frontend Modernization: WebSocket Integration
 */

/* eslint-disable no-use-before-define, no-console, max-len, no-new, no-unused-vars */

import { initializeSocket, onEvent } from './socket-client.js';
import { eventBus, EventTypes } from './eventBus.js';

let socketInitialized = false;

/**
 * Load notifications sidebar and update badge
 */
async function loadNotificationsSidebar() {
  try {
    const container = document.getElementById('secondary-sidebar-content');
    if (!container) {
      console.error('Secondary sidebar content container not found');
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Loading notifications...</p></div>';

    // Fetch sidebar content
    const response = await fetch('/notifications/sidebar', {
      method: 'GET',
      headers: {
        'X-Sidebar-Request': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    container.innerHTML = html;

    // Initialize timestamp formatting immediately after content is loaded
    if (typeof window.initializeRelativeTime === 'function') {
      window.initializeRelativeTime();
    }

    // Open sidebar
    openSecondarySidebar();

    // Update badge
    updateNotificationBadge();

    // Emit event bus notification
    eventBus.emit(EventTypes.SIDEBAR_CONTENT_LOADED, {
      url: '/notifications/sidebar',
      fullWidth: false,
    });

    eventBus.emit(EventTypes.SIDEBAR_OPENED, { url: '/notifications/sidebar' });
  } catch (error) {
    console.error('Error loading notifications sidebar:', error);
    const container = document.getElementById('secondary-sidebar-content');
    if (container) {
      container.innerHTML = '<div class="p-4"><p class="text-red-600">Error loading notifications. Please try again.</p></div>';
    }
  }
}

/**
 * Update notification icon based on unread count
 */
async function updateNotificationBadge() {
  try {
    const response = await fetch('/notifications/api/count/unread');
    const data = await response.json();
    const count = data.unreadCount || 0;

    const icon = document.getElementById('notification-icon');
    if (!icon) return;

    // Update icon based on unread count
    if (count > 0) {
      icon.textContent = 'notifications_unread';
    } else {
      icon.textContent = 'notifications';
    }

    // Emit event bus notification
    eventBus.emit(EventTypes.NOTIFICATION_COUNT_CHANGED, { count });
  } catch (error) {
    console.error('Error updating notification icon:', error);
  }
}

/**
 * Show notification action that notification was processed
 */
function showActionFeedback(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed top-4 right-4 z-50 max-w-md`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(alertDiv);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    const bsAlert = new bootstrap.Alert(alertDiv);
    bsAlert.close();
  }, 3000);
}

/**
 * Initialize WebSocket connection and event listeners
 */
async function initializeWebSocket() {
  try {
    await initializeSocket();

    // Listen for new notifications
    onEvent('notification:new', (notification) => {
      console.log('📬 New notification received:', notification);

      // Emit event bus notification
      eventBus.emit(EventTypes.NOTIFICATION_RECEIVED, notification);

      // Update badge counts
      updateNotificationBadge();

      // Reload sidebar if open
      const sidebar = document.getElementById('secondary-sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        loadNotificationsSidebar();
      }

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Notification', {
          body: notification.message,
          icon: '/img/logo.png',
        });
      }
    });

    // Listen for notification updates (e.g., marked as read)
    onEvent('notification:updated', (data) => {
      console.log('🔄 Notification updated:', data);

      // Update badge counts
      updateNotificationBadge();

      // Reload sidebar if open
      const sidebar = document.getElementById('secondary-sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        loadNotificationsSidebar();
      }
    });

    // Listen for notification deletions
    onEvent('notification:deleted', (data) => {
      console.log('🗑️ Notification deleted:', data);

      // Update badge counts
      updateNotificationBadge();

      // Reload sidebar if open
      const sidebar = document.getElementById('secondary-sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        loadNotificationsSidebar();
      }
    });

    console.log('✅ Notification WebSocket initialized');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket:', error);
  }
}

/**
 * Initialize notification system on page load
 */
function initializeNotifications() {
  // Update badge on load
  updateNotificationBadge();

  // Initialize WebSocket (only once)
  if (!socketInitialized) {
    initializeWebSocket();
    socketInitialized = true;
  }

  // Make sidebar loader available globally
  window.loadNotificationsSidebar = loadNotificationsSidebar;
}

// ============================================================================
// EXPORTS
// ============================================================================

// ES6 Module exports
export {
  loadNotificationsSidebar,
  updateNotificationBadge,
  initializeNotifications,
};

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.loadNotificationsSidebar = loadNotificationsSidebar;
  window.updateNotificationBadge = updateNotificationBadge;
  window.initializeNotifications = initializeNotifications;
  window.showActionFeedback = showActionFeedback;
}
