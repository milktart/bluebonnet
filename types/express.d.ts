/**
 * Express Type Extensions
 * Extends Express Request/Response with custom properties
 */

import { Session } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      session: Session & {
        returnTo?: string;
      };
      flash(type: string, message?: string): any;
      user?: any;
      isAuthenticated(callback?: (err: Error | null, authenticated?: boolean) => void): boolean;
      logout(callback?: (err?: Error) => void): void;
      login(user: any, callback?: (err?: Error) => void): void;
    }

    interface Response {
      locals: {
        isSidebarRequest?: boolean;
        [key: string]: any;
      };
    }
  }
}

export {};
