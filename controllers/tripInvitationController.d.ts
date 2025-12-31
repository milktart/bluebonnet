/**
 * Trip Invitation Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface TripInvitationController {
  getInvitations(req: Request, res: Response): Promise<void>;
  createInvitation(req: Request, res: Response): Promise<void>;
  respondToInvitation(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const tripInvitationController: TripInvitationController;
export default tripInvitationController;
