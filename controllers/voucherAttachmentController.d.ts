/**
 * Voucher Attachment Controller Type Declarations
 */

import { Request, Response } from 'express';

export interface VoucherAttachmentController {
  uploadAttachment(req: Request, res: Response): Promise<void>;
  deleteAttachment(req: Request, res: Response): Promise<void>;
  [key: string]: any;
}

declare const voucherAttachmentController: VoucherAttachmentController;
export default voucherAttachmentController;
