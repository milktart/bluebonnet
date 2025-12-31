/**
 * Trip Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface TripController {
  getPrimarySidebarContent(req: Request, res: Response, options?: any): Promise<void>;
  createTrip(req: Request, res: Response): Promise<void>;
  updateTrip(req: Request, res: Response): Promise<void>;
  deleteTrip(req: Request, res: Response): Promise<void>;
  getTripDetails(req: Request, res: Response): Promise<void>;
  dashboardTrips(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const tripController: TripController;
export default tripController;
