/**
 * Event Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface EventController {
  createEvent(req: Request, res: Response): Promise<void>;
  updateEvent(req: Request, res: Response): Promise<void>;
  deleteEvent(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const eventController: EventController;
export default eventController;
