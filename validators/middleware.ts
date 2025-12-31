/**
 * Validation Middleware
 * Express middleware for validating request bodies, query params, and route params
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Create validation middleware
 * Validates incoming request against provided Zod schemas
 * Returns 400 Bad Request if validation fails
 */
export function validate(options: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (options.body) {
        const bodyValidation = options.body.safeParse(req.body);
        if (!bodyValidation.success) {
          return res.status(400).json({
            success: false,
            message: 'Request body validation failed',
            errors: bodyValidation.error.issues.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          });
        }
        req.body = bodyValidation.data;
      }

      // Validate query parameters if schema provided
      if (options.query) {
        const queryValidation = options.query.safeParse(req.query);
        if (!queryValidation.success) {
          return res.status(400).json({
            success: false,
            message: 'Query parameters validation failed',
            errors: queryValidation.error.issues.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          });
        }
        req.query = queryValidation.data as any;
      }

      // Validate route parameters if schema provided
      if (options.params) {
        const paramsValidation = options.params.safeParse(req.params);
        if (!paramsValidation.success) {
          return res.status(400).json({
            success: false,
            message: 'Route parameters validation failed',
            errors: paramsValidation.error.issues.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          });
        }
        req.params = paramsValidation.data as any;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Validation error',
        errors: [error.message],
      });
    }
  };
}

/**
 * Validate request body only
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Validate query parameters only
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * Validate route parameters only
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}

/**
 * Validate multiple parts (body, query, params)
 */
export function validateRequest(options: ValidationOptions) {
  return validate(options);
}
