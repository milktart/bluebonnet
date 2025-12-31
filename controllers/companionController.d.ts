/**
 * Companion Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface CompanionController {
  getCompanions(req: Request, res: Response): Promise<void>;
  createCompanion(req: Request, res: Response): Promise<void>;
  updateCompanion(req: Request, res: Response): Promise<void>;
  deleteCompanion(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const companionController: CompanionController;
export default companionController;
