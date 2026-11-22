import { NextFunction, Request, Response } from "express";

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!request.session.adminId) {
    response.status(401).json({ message: "Please sign in to continue." });
    return;
  }
  next();
}
