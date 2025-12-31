/**
 * Sidebar Content Middleware
 * Sets a flag for sidebar-specific request handling
 * If X-Sidebar-Request header is present, content is rendered without full layout
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Set sidebar request flag
 * Allows templates to conditionally render sidebar content
 */
export function setSidebarFlag(req: Request, res: Response, next: NextFunction): void {
  (res.locals as any).isSidebarRequest = req.get('X-Sidebar-Request') === 'true';
  next();
}

export default {
  setSidebarFlag,
};
