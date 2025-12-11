/**
 * Shared Event Handlers
 * Phase 4 - Frontend Modernization: Event Delegation
 *
 * Consolidated handlers shared across multiple pages
 */

/* eslint-disable no-alert, no-console */

import { registerHandlers, getElementData } from './event-delegation.js';

/**
 * These handlers wrap global functions that are defined in inline scripts
 * or other modules. This allows us to use event delegation while maintaining
 * compatibility with existing code.
 */

/**
 * Show add form - wraps global showAddForm function
 * Usage: <button data-action="showAddForm" data-form-type="flight">
 */
function handleShowAddForm(element, _event) {
  const { formType } = getElementData(element);
  if (typeof window.showAddForm === 'function') {
    window.showAddForm(formType);
  }
}

/**
 * Show add item menu - wraps global showAddItemMenu function
 * Usage: <button data-action="showAddItemMenu">
 */
function handleShowAddItemMenu(_element, _event) {
  if (typeof window.showAddItemMenu === 'function') {
    window.showAddItemMenu();
  }
}

/**
 * Mark notification as read
 * Usage: <div data-action="markNotificationAsRead" data-notification-id="123">
 */
async function handleMarkNotificationAsRead(element, _event) {
  const { notificationId } = getElementData(element);

  if (typeof window.markNotificationAsRead === 'function') {
    window.markNotificationAsRead(notificationId);
  }
}

/**
 * Delete notification
 * Usage: <button data-action="deleteNotification" data-notification-id="123">
 */
async function handleDeleteNotification(element, event) {
  const { notificationId } = getElementData(element);

  if (typeof window.deleteNotification === 'function') {
    event.stopPropagation();
    window.deleteNotification(notificationId);
  }
}

/**
 * Handle companion action (accept/decline)
 * Usage: <button data-action="handleCompanionAction" data-notification-id="123" data-related-id="456" data-companion-action="accept">
 */
async function handleCompanionAction(element, _event) {
  const { notificationId, relatedId, companionAction } = getElementData(element);

  if (typeof window.handleCompanionAction === 'function') {
    window.handleCompanionAction(notificationId, relatedId, companionAction);
  }
}

/**
 * Handle trip action (join/decline)
 * Usage: <button data-action="handleTripAction" data-notification-id="123" data-related-id="456" data-trip-action="join">
 */
async function handleTripAction(element, _event) {
  const { notificationId, relatedId, tripAction } = getElementData(element);

  if (typeof window.handleTripAction === 'function') {
    window.handleTripAction(notificationId, relatedId, tripAction);
  }
}

/**
 * Sort table
 * Usage: <th data-action="sortTable" data-column="voucherNumber">
 */
function handleSortTable(element, _event) {
  const { column } = getElementData(element);

  if (typeof window.sortTable === 'function') {
    window.sortTable(column);
  }
}

/**
 * Filter handler - calls filter function
 * Usage: <select data-on-change="filterItems">
 */
function handleFilterItems(_element, _event) {
  if (typeof window.filterVouchers === 'function') {
    window.filterVouchers();
  } else if (typeof window.filterItems === 'function') {
    window.filterItems();
  }
}

/**
 * Show add voucher modal
 * Usage: <button data-action="showAddVoucherModal">
 */
function handleShowAddVoucherModal(_element, _event) {
  if (typeof window.showAddVoucherModal === 'function') {
    window.showAddVoucherModal();
  }
}

/**
 * Close voucher modal
 * Usage: <button data-action="closeVoucherModal">
 */
function handleCloseVoucherModal(_element, _event) {
  if (typeof window.closeVoucherModal === 'function') {
    window.closeVoucherModal();
  }
}

/**
 * Edit voucher
 * Usage: <button data-action="editVoucher" data-voucher-id="123">
 */
function handleEditVoucher(element, _event) {
  const { voucherId } = getElementData(element);

  if (typeof window.editVoucher === 'function') {
    window.editVoucher(voucherId);
  }
}

/**
 * Delete voucher
 * Usage: <button data-action="deleteVoucher" data-voucher-id="123" data-voucher-number="ABC123">
 */
function handleDeleteVoucher(element, _event) {
  const { voucherId, voucherNumber } = getElementData(element);

  if (typeof window.deleteVoucher === 'function') {
    window.deleteVoucher(voucherId, voucherNumber);
  }
}

/**
 * Reissue remainder
 * Usage: <button data-action="reissueRemainder" data-voucher-id="123" data-remaining-balance="100.00">
 */
function handleReissueRemainder(element, _event) {
  const { voucherId, remainingBalance } = getElementData(element);

  if (typeof window.reissueRemainder === 'function') {
    window.reissueRemainder(voucherId, remainingBalance);
  }
}

/**
 * Register all shared handlers
 */
function registerSharedHandlers() {
  registerHandlers({
    showAddForm: handleShowAddForm,
    showAddItemMenu: handleShowAddItemMenu,
    markNotificationAsRead: handleMarkNotificationAsRead,
    deleteNotification: handleDeleteNotification,
    handleCompanionAction,
    handleTripAction,
    sortTable: handleSortTable,
    filterItems: handleFilterItems,
    showAddVoucherModal: handleShowAddVoucherModal,
    closeVoucherModal: handleCloseVoucherModal,
    editVoucher: handleEditVoucher,
    deleteVoucher: handleDeleteVoucher,
    reissueRemainder: handleReissueRemainder,
  });
}

// Initialize on module load
registerSharedHandlers();

export default registerSharedHandlers;
