/**
 * Notification Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface NotificationController {
  getNotifications(req: Request, res: Response): Promise<void>;
  markAsRead(req: Request, res: Response): Promise<void>;
  deleteNotification(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const notificationController: NotificationController;
export default notificationController;
