/**
 * Voucher Attachment Helper
 * Utilities for working with polymorphic voucher attachments across item types
 * Supports: Flight, Hotel, Event, CarRental, Transportation
 */

const { VoucherAttachment } = require('../models');

/**
 * Get the model for an item type
 * @param {string} itemType - Type of item (flight, hotel, event, car_rental, transportation)
 * @param {Object} models - Models object from sequelize
 * @returns {Object} Sequelize model for the item type
 */
function getModelForItemType(itemType, models) {
  const modelMap = {
    flight: models.Flight,
    hotel: models.Hotel,
    event: models.Event,
    car_rental: models.CarRental,
    transportation: models.Transportation,
  };

  return modelMap[itemType];
}

/**
 * Create a voucher attachment for an item
 * @param {Object} data - Attachment data
 * @param {string} data.voucherId - ID of the voucher
 * @param {string} data.itemId - ID of the travel item
 * @param {string} data.itemType - Type of travel item
 * @param {string} data.travelerId - ID of traveler (User or TravelCompanion)
 * @param {string} data.travelerType - Type of traveler (USER or COMPANION)
 * @param {number} data.attachmentValue - Monetary value (optional)
 * @param {Date} data.attachmentDate - Date attached (optional)
 * @param {string} data.notes - Notes (optional)
 * @returns {Promise<Object>} Created VoucherAttachment record
 */
async function createVoucherAttachment(data) {
  const attachment = await VoucherAttachment.create({
    voucherId: data.voucherId,
    itemId: data.itemId,
    itemType: data.itemType,
    travelerId: data.travelerId,
    travelerType: data.travelerType,
    attachmentValue: data.attachmentValue || null,
    attachmentDate: data.attachmentDate || null,
    notes: data.notes || null,
  });

  return attachment;
}

/**
 * Get voucher attachments for an item
 * @param {string} itemId - ID of the travel item
 * @param {string} itemType - Type of travel item
 * @returns {Promise<Array>} Array of VoucherAttachment records
 */
async function getVoucherAttachmentsForItem(itemId, itemType) {
  return VoucherAttachment.findAll({
    where: {
      itemId,
      itemType,
    },
  });
}

/**
 * Delete voucher attachment
 * @param {string} attachmentId - ID of the attachment to delete
 * @returns {Promise<number>} Number of rows deleted
 */
async function deleteVoucherAttachment(attachmentId) {
  return VoucherAttachment.destroy({
    where: { id: attachmentId },
  });
}

/**
 * Delete all voucher attachments for an item (used when deleting item)
 * @param {string} itemId - ID of the travel item
 * @param {string} itemType - Type of travel item
 * @returns {Promise<number>} Number of rows deleted
 */
async function deleteVoucherAttachmentsForItem(itemId, itemType) {
  return VoucherAttachment.destroy({
    where: {
      itemId,
      itemType,
    },
  });
}

/**
 * Update voucher attachment
 * @param {string} attachmentId - ID of the attachment
 * @param {Object} updates - Fields to update
 * @returns {Promise<Array>} Array of affected rows
 */
async function updateVoucherAttachment(attachmentId, updates) {
  return VoucherAttachment.update(updates, {
    where: { id: attachmentId },
  });
}

/**
 * Validate that an item type is supported
 * @param {string} itemType - Type of item to validate
 * @returns {boolean} True if item type is supported
 */
function isValidItemType(itemType) {
  const validTypes = ['flight', 'hotel', 'event', 'car_rental', 'transportation'];
  return validTypes.includes(itemType);
}

module.exports = {
  getModelForItemType,
  createVoucherAttachment,
  getVoucherAttachmentsForItem,
  deleteVoucherAttachment,
  deleteVoucherAttachmentsForItem,
  updateVoucherAttachment,
  isValidItemType,
};
