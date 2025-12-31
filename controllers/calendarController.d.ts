/**
 * Calendar Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface CalendarController {
  getCalendarSidebar(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const calendarController: CalendarController;
export default calendarController;
