import { Response, NextFunction } from "express";
import { prisma } from "..";
import { AuthRequest } from "../types/AuthRequest.type";

export async function teamMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user!.teamId === null) {
    throw new Error("User is not in a team");
  } else {
    next();
  }
}
