/**
 * Transportation Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface TransportationController {
  createTransportation(req: Request, res: Response): Promise<void>;
  updateTransportation(req: Request, res: Response): Promise<void>;
  deleteTransportation(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const transportationController: TransportationController;
export default transportationController;
