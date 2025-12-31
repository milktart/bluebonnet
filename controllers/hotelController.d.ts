/**
 * Hotel Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface HotelController {
  createHotel(req: Request, res: Response): Promise<void>;
  updateHotel(req: Request, res: Response): Promise<void>;
  deleteHotel(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const hotelController: HotelController;
export default hotelController;
