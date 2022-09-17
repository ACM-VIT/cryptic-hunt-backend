// auth router
import { User } from "@prisma/client";
import express from "express";
import { prisma } from ".";
import { OAuth2Client } from "google-auth-library";
import { auth } from "./firebase/firebase";
const client = new OAuth2Client(process.env.CLIENT_ID);

interface GoogleUserType {
  iss: string;
  sub: string;
  azp: string;
  aud: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean | undefined;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
}

async function verify(token: string) {
  // const ticket = await client.verifyIdToken({
  //   idToken: token,
  //   audience: process.env.CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
  //   // Or, if multiple clients access the backend:
  //   //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  // });
  // const payload = ticket.getPayload() as GoogleUserType;
  // // If request specified a G Suite domain:
  // // const domain = payload['hd'];
  // return payload;
  const decodedToken = await auth.verifyIdToken(token);
  console.log(decodedToken);
  return decodedToken;
}

export interface AuthRequest extends express.Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    // extract token from request
    const isToken = req.headers["authorization"]?.split(" ")[1];
    if (!isToken) {
      throw new Error("Token not found");
    }

    // verify user's google authentication
    const userGoogle = await verify(isToken);

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
  } catch (error) {
    console.error(error);
    console.log(process.env.CLIENT_ID);
    // if user is not found
    return res.status(401).json({ message: "Unauthorized" });
  }
};
