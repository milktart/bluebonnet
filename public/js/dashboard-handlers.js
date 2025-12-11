/**
 * Dashboard Event Handlers
 * Phase 4 - Frontend Modernization: Event Delegation
 *
 * Registers handlers for dashboard page interactions
 */

/* eslint-disable no-alert, no-console */

import { registerHandlers, getElementData } from './event-delegation.js';
import {
  showUpcomingTrips,
  showPastTrips,
  showSettings,
  toggleAccordion,
} from './trips-list.js';

/**
 * Close secondary sidebar
 */
function handleCloseSecondarySidebar(_element, _event) {
  if (typeof window.closeSecondarySidebar === 'function') {
    window.closeSecondarySidebar();
  }
}

/**
 * Open secondary sidebar
 */
function handleOpenSecondarySidebar(_element, _event) {
  if (typeof window.openSecondarySidebar === 'function') {
    window.openSecondarySidebar();
  }
}

/**
 * Close tertiary sidebar
 */
function handleCloseTertiarySidebar(_element, _event) {
  if (typeof window.closeTertiarySidebar === 'function') {
    window.closeTertiarySidebar();
  }
}

/**
 * Go back in sidebar history
 */
function handleGoBackInSidebar(_element, _event) {
  if (typeof window.goBackInSidebar === 'function') {
    window.goBackInSidebar();
  }
}

/**
 * Show create trip form
 */
function handleShowCreateTripForm(_element, _event) {
  if (typeof window.loadSidebarContent === 'function') {
    window.loadSidebarContent('/trips/form');
  }
}

/**
 * Show create event form
 */
function handleShowCreateEventForm(_element, _event) {
  if (typeof window.loadSidebarContent === 'function') {
    window.loadSidebarContent('/events/form');
  }
}

/**
 * Remove companion from trip
 * Usage: <button data-action="removeCompanionFromTrip" data-companion-id="123">×</button>
 */
function handleRemoveCompanionFromTrip(element, _event) {
  const { companionId } = getElementData(element);

  if (typeof window.removeCompanionFromTrip === 'function') {
    window.removeCompanionFromTrip(companionId, element);
  }
}

/**
 * Add companion to trip
 * Usage: <div data-action="addCompanionToTrip" data-companion-id="123" data-companion-name="John">
 */
function handleAddCompanionToTrip(element, event) {
  const { companionId, companionName } = getElementData(element);

  if (typeof window.addCompanionToTrip === 'function') {
    event.preventDefault();
    event.stopPropagation();
    window.addCompanionToTrip(companionId, companionName, event);
  }
}

/**
 * Toggle notification center
 */
function handleToggleNotificationCenter(_element, _event) {
  if (typeof window.toggleNotificationCenter === 'function') {
    window.toggleNotificationCenter();
  }
}

/**
 * Show upcoming trips tab
 */
function handleShowUpcomingTrips(element, _event) {
  const { updateHistory } = getElementData(element);

  if (updateHistory === 'true') {
    window.history.pushState({}, '', '/');
  }

  showUpcomingTrips();
}

/**
 * Show past trips tab
 */
function handleShowPastTrips(element, _event) {
  const { updateHistory } = getElementData(element);

  if (updateHistory === 'true') {
    window.history.pushState({}, '', '/trips/past');
  }

  showPastTrips();
}

/**
 * Show settings tab
 */
function handleShowSettings(element, _event) {
  const { updateHistory } = getElementData(element);

  if (updateHistory === 'true') {
    window.history.pushState({}, '', '/manage');
  }

  showSettings();
}

/**
 * Toggle accordion
 * Usage: <button data-action="toggleAccordion" data-accordion-id="upcoming-0">
 */
function handleToggleAccordion(element, _event) {
  const { accordionId } = getElementData(element);

  toggleAccordion(accordionId);
}

/**
 * Respond to trip invitation
 * Usage: <button data-action="respondToTripInvitation" data-trip-id="123" data-response="join" data-invitation-id="456">
 */
async function handleRespondToTripInvitation(element, _event) {
  const { response, invitationId } = getElementData(element);

  try {
    const respondRes = await fetch(`/trip-invitations/${invitationId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    });

    if (respondRes.ok) {
      // Silently reload after responding to invitation
      setTimeout(() => location.reload(), 300);
    }
  } catch (error) {
    // Error responding to invitation
  }
}

/**
 * Load sidebar content
 * Usage: <button data-action="loadSidebarContent" data-url="/account/sidebar" data-full-width="true">
 */
function handleLoadSidebarContent(element, _event) {
  const { url, fullWidth, updateHistory, historyPath } = getElementData(element);

  if (updateHistory === 'true' && historyPath) {
    window.history.pushState({}, '', historyPath);
  }

  if (typeof window.loadSidebarContent === 'function') {
    const options = {};
    if (fullWidth === 'true') {
      options.fullWidth = true;
    }
    window.loadSidebarContent(url, options);
  }
}

/**
 * Navigate to trip detail page
 * Usage: <div data-action="navigateToTrip" data-trip-id="123">
 */
function handleNavigateToTrip(element, event) {
  const { tripId } = getElementData(element);

  if (tripId) {
    // Stop propagation to prevent parent handlers from firing
    event.stopPropagation();
    window.location.href = `/trips/${tripId}`;
  }
}

/**
 * Load sidebar content for standalone event
 * Usage: <div data-action="loadEventSidebar" data-event-id="123">
 * NOTE: Now uses the same flow as other items - loads edit form directly
 */
function handleLoadEventSidebar(element, event) {
  const { eventId } = getElementData(element);

  if (eventId && typeof window.loadSidebarContent === 'function') {
    // Stop propagation to prevent other handlers from interfering
    event.stopPropagation();
    // Load edit form directly - same as other item types for consistency
    window.loadSidebarContent(`/events/${eventId}/form`);
  }
}

/**
 * Load sidebar content for standalone items (flight, hotel, transportation, car rental)
 * Usage: <div data-action="loadStandaloneSidebar" data-item-type="flight" data-item-id="123">
 */
function handleLoadStandaloneSidebar(element, event) {
  const { itemType, itemId } = getElementData(element);

  if (!itemType || !itemId) {
    return;
  }

  // Map item type to correct endpoint
  const endpointMap = {
    flight: `/flights/${itemId}/form`,
    hotel: `/hotels/${itemId}/form`,
    transportation: `/transportation/${itemId}/form`,
    carRental: `/car-rentals/${itemId}/form`,
  };

  const url = endpointMap[itemType];

  if (url && typeof window.loadSidebarContent === 'function') {
    // Stop propagation to prevent other handlers from interfering
    event.stopPropagation();
    window.loadSidebarContent(url);
  }
}

/**
 * Show new item menu (trip or standalone item creation)
 * Usage: <button onclick="showNewItemMenu()">
 */
function handleShowNewItemMenu() {
  if (typeof window.loadSidebarContent === 'function') {
    window.loadSidebarContent('/new-item-menu');
  }
}

/**
 * Register all dashboard handlers
 */
function registerDashboardHandlers() {
  registerHandlers({
    closeSecondarySidebar: handleCloseSecondarySidebar,
    openSecondarySidebar: handleOpenSecondarySidebar,
    closeTertiarySidebar: handleCloseTertiarySidebar,
    goBackInSidebar: handleGoBackInSidebar,
    showCreateTripForm: handleShowCreateTripForm,
    showCreateEventForm: handleShowCreateEventForm,
    removeCompanionFromTrip: handleRemoveCompanionFromTrip,
    addCompanionToTrip: handleAddCompanionToTrip,
    toggleNotificationCenter: handleToggleNotificationCenter,
    showUpcomingTrips: handleShowUpcomingTrips,
    showPastTrips: handleShowPastTrips,
    showSettings: handleShowSettings,
    toggleAccordion: handleToggleAccordion,
    respondToTripInvitation: handleRespondToTripInvitation,
    loadSidebarContent: handleLoadSidebarContent,
    navigateToTrip: handleNavigateToTrip,
    loadEventSidebar: handleLoadEventSidebar,
    loadStandaloneSidebar: handleLoadStandaloneSidebar,
    showNewItemMenu: handleShowNewItemMenu,
  });

  // Expose functions globally for onclick handlers
  window.showNewItemMenu = handleShowNewItemMenu;
  window.showCreateTripForm = handleShowCreateTripForm;
  window.showCreateEventForm = handleShowCreateEventForm;
}

// Initialize on module load
registerDashboardHandlers();

export default registerDashboardHandlers;
