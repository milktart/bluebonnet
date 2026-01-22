'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Migration: Backfill coordinates for transportation items
     *
     * This migration geocodes all transportation items that have origin/destination
     * but missing coordinates, and updates their lat/lng fields.
     */
    try {
      const Transportation = require('../models').Transportation;
      const geocodingService = require('../services/geocodingService');
      const logger = require('../utils/logger');

      // Find all transportation items without coordinates
      const itemsNeedingCoords = await Transportation.findAll({
        where: {
          [Sequelize.Op.or]: [
            { originLat: null },
            { originLng: null },
            { destinationLat: null },
            { destinationLng: null },
          ],
        },
      });

      logger.info(`Found ${itemsNeedingCoords.length} transportation items without coordinates`);

      // Geocode and update each item
      let updated = 0;
      for (const item of itemsNeedingCoords) {
        try {
          const { originCoords, destCoords } = await geocodingService.geocodeOriginDestination({
            originNew: item.origin,
            destNew: item.destination,
          });

          if (originCoords || destCoords) {
            await item.update({
              originLat: originCoords?.lat || item.originLat,
              originLng: originCoords?.lng || item.originLng,
              destinationLat: destCoords?.lat || item.destinationLat,
              destinationLng: destCoords?.lng || item.destinationLng,
            });
            updated++;
            logger.info(
              `Updated transportation item ${item.id}: ${item.origin} -> ${item.destination}`
            );
          }
        } catch (err) {
          logger.warn(`Could not geocode transportation ${item.id}: ${err.message}`);
        }
      }

      logger.info(
        `Successfully updated ${updated}/${itemsNeedingCoords.length} transportation items with coordinates`
      );
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is data-preserving and non-destructive
    // No down migration needed
    console.log('Migration 20260121-backfill-transportation-coordinates completed.');
  },
};
