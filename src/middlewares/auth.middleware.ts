import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

// Middleware to check if the user is authenticated
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    (req as any).session = session;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking authentication",
    });
  }
};

// Middleware to check if the user has a specific role
export const hasRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = (req as any).session;
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      if (session.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error checking role",
      });
    }
  };
};
