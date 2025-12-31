/**
 * Item Companion Helper Type Declarations
 */

export interface ItemCompanionData {
  [key: string]: any;
}

declare const itemCompanionHelper: {
  validateCompanionForItem(itemId: string, companionId: string): Promise<boolean>;
  addCompanionToItem(itemId: string, itemType: string, companionId: string): Promise<any>;
  removeCompanionFromItem(itemId: string, companionId: string): Promise<void>;
  [key: string]: any;
};

export default itemCompanionHelper;
