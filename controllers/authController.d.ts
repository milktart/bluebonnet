/**
 * Auth Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface AuthController {
  getLogin(req: Request, res: Response): void;
  getRegister(req: Request, res: Response): void;
  postRegister(req: Request, res: Response): Promise<void>;
  postLogin(req: Request, res: Response): void;
  logout(req: Request, res: Response): void;
}

declare const authController: AuthController;
export default authController;
