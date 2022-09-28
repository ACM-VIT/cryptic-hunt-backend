import { Request, Response, NextFunction } from "express";

export async function teamMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user.teamId === null) {
    return res.status(401).json({
      message: "You are not part of a team",
    });
  } else {
    next();
  }
}
