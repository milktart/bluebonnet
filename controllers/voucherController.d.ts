/**
 * Voucher Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface VoucherController {
  getVouchers(req: Request, res: Response): Promise<void>;
  createVoucher(req: Request, res: Response): Promise<void>;
  updateVoucher(req: Request, res: Response): Promise<void>;
  deleteVoucher(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const voucherController: VoucherController;
export default voucherController;
