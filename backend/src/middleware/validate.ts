import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with field-level error messages on failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ success: false, error: errors[0], errors, data: null });
      return;
    }

    // Replace body with parsed + coerced values
    req.body = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((e) => {
    const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
    return `${path}${e.message}`;
  });
}
