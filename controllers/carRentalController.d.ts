/**
 * Car Rental Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface CarRentalController {
  createCarRental(req: Request, res: Response): Promise<void>;
  updateCarRental(req: Request, res: Response): Promise<void>;
  deleteCarRental(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const carRentalController: CarRentalController;
export default carRentalController;
