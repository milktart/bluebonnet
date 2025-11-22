/**
 * Frontend Constants
 * Centralized constants for client-side JavaScript
 * Matches backend utils/constants.js where applicable
 */

// Time constants (milliseconds)
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// UI Interaction Delays
const UI_DEBOUNCE_DELAY = 100; // Debounce for rapid UI interactions
const UI_NOTIFICATION_DISMISS = 3000; // Notification auto-dismiss timeout
const UI_ALERT_AUTO_DISMISS = 5000; // Alert auto-hide timeout
const UI_RELOAD_DELAY = 500; // Page reload delay after action

// Socket/Network
const SOCKET_POLL_INTERVAL = 100; // Socket.IO library load check interval
const SOCKET_RECONNECT_DELAY = 1000; // Initial reconnection delay
const SOCKET_RECONNECT_DELAY_MAX = 5000; // Maximum reconnection delay

// Make constants available globally
window.CONSTANTS = {
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_HOUR,
  MS_PER_DAY,
  UI_DEBOUNCE_DELAY,
  UI_NOTIFICATION_DISMISS,
  UI_ALERT_AUTO_DISMISS,
  UI_RELOAD_DELAY,
  SOCKET_POLL_INTERVAL,
  SOCKET_RECONNECT_DELAY,
  SOCKET_RECONNECT_DELAY_MAX,
};
