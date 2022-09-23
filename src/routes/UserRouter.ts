import { Request, Response, Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "..";

const router = Router();

router.post("/profile", async (req: Request, res: Response) => {
  const { gender, rollNo, phoneNo } = req.body;

  try {
    const user_signup = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: { gender, rollNo, phoneNo },
    });
    return res.json(user_signup);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.log(e);
      return res
        .status(501)
        .json({ error: "unable to modify profile details" });
    }
  }
});

router.get("/profile", async (req: Request, res: Response) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: {
        id: req.user.id,
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
export default router;
