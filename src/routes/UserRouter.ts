import { Response } from "express";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { AuthRequest } from "../auth";
const prisma = new PrismaClient();
const user_router = express.Router();

user_router.post("/profile", async (req: AuthRequest, res: Response) => {
  const { gender, rollNo, phoneNo } = req.body;
  try {
    const user_signup = await prisma.user.update({
      where: {
        id: req.user!.id,
      },
      data: { gender, rollNo, phoneNo },
    });
    return res.json(user_signup);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(e);
      return res
        .status(501)
        .json({ error: "unabele to modify profile details" });
    }
  }
});

user_router.get("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
      include: {
        team: true,
      },
    });
    return res.json(userProfile);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(e);
      return res
        .status(501)
        .json({ error: "an error occured while getting user profile" });
    }
  }
});
export default user_router;
