// Middleware for validation requests using Zod schemas
import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

// Middleware to validate request body against a Zod schema
export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = schema.parse(req.body);
      req.body = parsedBody;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error validating request body",
      });
    }
  };
};
