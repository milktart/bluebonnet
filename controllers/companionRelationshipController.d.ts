/**
 * Companion Relationship Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface CompanionRelationshipController {
  getRelationships(req: Request, res: Response): Promise<void>;
  createRelationship(req: Request, res: Response): Promise<void>;
  updateRelationship(req: Request, res: Response): Promise<void>;
  deleteRelationship(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const companionRelationshipController: CompanionRelationshipController;
export default companionRelationshipController;
