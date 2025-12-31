/**
 * Flight Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface FlightController {
  searchAirports(req: Request, res: Response): Promise<void>;
  searchFlight(req: Request, res: Response): Promise<void>;
  createFlight(req: Request, res: Response): Promise<void>;
  updateFlight(req: Request, res: Response): Promise<void>;
  deleteFlight(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const flightController: FlightController;
export default flightController;
