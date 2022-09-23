import { Request, Response, NextFunction } from "express";
import { prisma } from "..";

async function checkwhitelist(email: string) {
  const whitelist = await prisma.whitelist.findUnique({
    where: {
      email: email,
    },
  });
  return whitelist;
}

export async function whitelistMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const isToken = req.headers["authorization"]?.split(" ")[1];
    if (!isToken) {
      throw new Error("Token not found");
    }
    const user = await checkwhitelist(req.user.email);
    if (!user) {
      return res.status(403).json({ message: "Not Whitelisted" });
    }
    return next();
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }
  }
}
