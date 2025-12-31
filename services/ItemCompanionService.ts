/**
 * Item Companion Service
 * Service for managing item companion assignments
 * Handles CRUD operations for companions attached to specific trip items
 * (flights, hotels, transportation, car rentals, events)
 */

import {
  ItemCompanion,
  TravelCompanion,
  Flight,
  Hotel,
  Transportation,
  CarRental,
  Event,
  Trip,
} from '../models';
import { sortCompanions } from '../utils/itemCompanionHelper';
import logger from '../utils/logger';
import { Model } from 'sequelize';

interface CompanionInfo {
  id: string;
  name: string;
  email: string;
}

interface UpdateResult {
  success: boolean;
  message: string;
  changes: {
    added: number;
    removed: number;
  };
}

export class ItemCompanionService {
  /**
   * Get all companions assigned to a specific item
   */
  async getItemCompanions(itemId: string, itemType: string, userEmail: string): Promise<CompanionInfo[]> {
    try {
      logger.debug('ItemCompanionService.getItemCompanions', { itemId, itemType, userEmail });

      const itemCompanions = await ItemCompanion.findAll({
        where: {
          itemType,
          itemId,
        },
        include: [
          {
            model: TravelCompanion,
            as: 'companion',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      // Transform to simpler format
      const companionList: CompanionInfo[] = itemCompanions.map((ic: any) => ({
        id: ic.companion.id,
        name: ic.companion.name,
        email: ic.companion.email,
      }));

      // Sort companions: self first, then alphabetically by first name
      const sortedCompanionList = sortCompanions(companionList, userEmail);

      logger.debug('ItemCompanionService.getItemCompanions - Result', {
        count: sortedCompanionList.length,
      });

      return sortedCompanionList;
    } catch (error) {
      logger.error('ItemCompanionService.getItemCompanions - Error:', error);
      throw error;
    }
  }

  /**
   * Update companions assigned to a specific item
   */
  async updateItemCompanions(
    itemId: string,
    itemType: string,
    companionIds: string[],
    userId: string
  ): Promise<UpdateResult> {
    try {
      logger.debug('ItemCompanionService.updateItemCompanions', {
        itemId,
        itemType,
        companionIds,
        userId,
      });

      // Validate input
      if (!Array.isArray(companionIds)) {
        throw new Error('companionIds must be an array');
      }

      // Get the item model based on type
      const itemModel = this._getItemModel(itemType);
      if (!itemModel) {
        throw new Error('Invalid itemType');
      }

      // Verify item exists
      const item = await (itemModel as any).findOne({ where: { id: itemId } });
      if (!item) {
        const error: any = new Error('Item not found');
        error.status = 404;
        throw error;
      }

      // Verify user owns the item or the trip containing this item
      if ((item as any).tripId) {
        // Trip-associated item: verify user owns the trip
        const trip = await Trip.findOne({
          where: { id: (item as any).tripId, userId },
        });

        if (!trip) {
          const error: any = new Error('Not authorized to modify this item');
          error.status = 403;
          throw error;
        }
      } else {
        // Standalone item: verify user owns the item directly
        if ((item as any).userId !== userId) {
          const error: any = new Error('Not authorized to modify this item');
          error.status = 403;
          throw error;
        }
      }

      // Get existing companions
      const existingCompanions = await ItemCompanion.findAll({
        where: { itemType, itemId },
      });

      const existingIds = existingCompanions.map((ic: any) => ic.companionId);

      // Remove companions that are no longer in the list
      const toRemove = existingIds.filter((id) => !companionIds.includes(id));
      if (toRemove.length > 0) {
        await ItemCompanion.destroy({
          where: {
            itemType,
            itemId,
            companionId: toRemove,
          },
        });
        logger.debug('ItemCompanionService.updateItemCompanions - Removed companions', {
          count: toRemove.length,
        });
      }

      // Add new companions that aren't already there
      const toAdd = companionIds.filter((id) => !existingIds.includes(id));
      if (toAdd.length > 0) {
        const newCompanions = toAdd.map((companionId) => ({
          itemType,
          itemId,
          companionId,
          status: 'attending',
          addedBy: userId,
          inheritedFromTrip: false,
        }));

        await ItemCompanion.bulkCreate(newCompanions);
        logger.debug('ItemCompanionService.updateItemCompanions - Added companions', {
          count: toAdd.length,
        });
      }

      logger.info('ItemCompanionService.updateItemCompanions - Success', {
        itemId,
        itemType,
        added: toAdd.length,
        removed: toRemove.length,
      });

      return {
        success: true,
        message: 'Item companions updated successfully',
        changes: {
          added: toAdd.length,
          removed: toRemove.length,
        },
      };
    } catch (error) {
      logger.error('ItemCompanionService.updateItemCompanions - Error:', error);
      throw error;
    }
  }

  /**
   * Get the Sequelize model for a given item type
   */
  private _getItemModel(itemType: string): typeof Model | null {
    const modelMap: { [key: string]: typeof Model } = {
      flight: Flight,
      hotel: Hotel,
      transportation: Transportation,
      car_rental: CarRental,
      event: Event,
    };

    return modelMap[itemType] || null;
  }
}

export const itemCompanionService = new ItemCompanionService();
export default itemCompanionService;
