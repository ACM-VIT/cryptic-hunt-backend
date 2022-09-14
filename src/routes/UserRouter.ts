import { Response } from "express";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { u_req } from "../models/req";
const prisma = new PrismaClient();
const user_router = express.Router();
user_router.post("/signup", async (req: u_req, res: Response) => {
  const { gender, rollnumber, phonenumber } = req.body;
  try {
    const user_signup = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        gender: gender,
        rollNo: rollnumber,
        phoneNo: phonenumber,
      },
    });
    res.json(user_signup);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(e);
      throw "an error occured while signing up";
    }
  }
});

export default user_router;
