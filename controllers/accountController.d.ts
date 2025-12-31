/**
 * Account Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface AccountController {
  getProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  changePassword(req: Request, res: Response): Promise<void>;
  getVouchers(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const accountController: AccountController;
export default accountController;
