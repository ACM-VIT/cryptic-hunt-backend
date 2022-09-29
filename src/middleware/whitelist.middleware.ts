import { Request, Response, NextFunction } from "express";
import { prisma } from "..";
import logger from "../services/logger.service";

async function checkwhitelist(email: string) {
  const whitelist = await prisma.whitelist.findUnique({
    where: {
      email: email,
    },
  });
  if (!whitelist) {
    return false;
  }
  if (whitelist.hasWhitelisted) {
    return true;
  }
  return false;
}

async function isBlacklisted(email: string) {
  const blacklist = await prisma.whitelist.findUnique({
    where: {
      email: email,
    },
  });
  if (blacklist?.isBlacklisted) {
    return true;
  }
  return false;
}

export async function whitelistMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const whitelist = await checkwhitelist(req.user.email);
    if (!whitelist) {
      return res.status(403).json({ message: "Not Whitelisted" });
    }
    const blacklisted = await isBlacklisted(req.user.email);
    if (blacklisted) {
      return res.status(401).json({ message: "You are disqualified" });
    }
    return next();
  } catch (error) {
    logger.error(error);
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }
  }
}
