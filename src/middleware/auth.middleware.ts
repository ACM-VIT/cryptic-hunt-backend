import { User } from "@prisma/client";
import { Response, NextFunction, Request } from "express";
import { prisma } from "..";
import { auth } from "../firebase/firebase";

export const authMiddleware = async (
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

    // check if user exists in database
    const user = await prisma.user.findUnique({
      where: {
        id: userGoogle.sub,
      },
    });

    // if user is found, move forward
    if (!!user) {
      req.user = user;
      return next();
    } else {
      // if user is not found, create a new user

      const newUser = await prisma.user.create({
        data: {
          id: userGoogle.sub,
          name: userGoogle.name,
          email: userGoogle.email!,
          picture: userGoogle.picture!,
        },
      });
      req.user = newUser;
      return next();
    }
  } catch (error: any) {
    // if FirebaseAuthError, return token expired
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired" });
    }
    console.error(error);
    console.log(process.env.CLIENT_ID);
    // if user is not found
    return res.status(401).json({ message: "Unauthorized" });
  }
};
