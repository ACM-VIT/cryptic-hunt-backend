import { Request, Response, NextFunction } from "express";

export async function teamMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user.teamId === null) {
    throw new Error("User is not in a team");
  } else {
    next();
  }
}
