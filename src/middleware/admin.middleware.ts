import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase/firebase";
import logger from "../services/logger.service";

const admins = process.env.ADMINS?.split(",");
logger.info(`Admins: ${admins}`);

async function verify(token: string) {
  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken;
}

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // extract token from request
    const isToken = req.headers["authorization"]?.split(" ")[1];
    if (!isToken) {
      throw new Error("Token not found");
    }

    // verify user's google authentication
    const userGoogle = await auth.verifyIdToken(isToken);

    logger.info(`User: ${userGoogle.email}`);
    // if user's email is in the list of admins, move forward
    if (!admins) {
      throw new Error("Admins .env not found");
    }
    if (admins.includes(userGoogle.email!)) {
      return next();
    } else {
      logger.info(`User: ${userGoogle.email} is not an admin`);
      throw new Error("User not authorized");
    }
  } catch (error) {
    logger.error(error);
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(401).json({ message: "Not an Admin, Fuck Off" });
  }
};
