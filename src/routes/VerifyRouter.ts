import { Request, Response, Router } from "express";
import { prisma } from "..";
import { readCsv, Record } from "../controllers/verify.controllers";
import { Prisma } from "@prisma/client";

const router = Router();

interface whitelistType {
  email: string;
  regno: string;
  name: string;
  mobile: string;
  college: string;
}

router.post("/whitelist", async (req: Request, res: Response) => {
  try {
    const { data } = req.body as { data: whitelistType[] };

    const records = await readCsv();
    const user = records.find(
      (record: Record) => record.email === req.user!.email
    );
    const len = user!.paid / 250;

    if (len !== data.length) {
      return res.status(400).json({
        message: `you can't nominate, you should nominate ${len - 1} users`,
      });
    }

    if (data[0].email !== req.user.email) {
      return res.status(400).json({
        message: `User's email not found`,
      });
    }
    for (const item of data) {
      if (typeof item !== "object") {
        return res.status(400).json({ message: "Invalid data" });
      }

      const { email, regno, name, mobile, college } = item;
      const check = await prisma.whitelist.findMany({
        where: {
          email,
          hasWhitelisted: true,
        },
      });
      if (check.length > 0) {
        return res.status(409).json({
          message: `${email} is already nominated!`,
        });
      }
      try {
        await prisma.whitelist.create({
          data: {
            email,
            regno,
            name,
            mobile,
            college,
            hasWhitelisted: true,
          },
        });
        return res.json({ message: "Form submitted successfully" });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            return res.json({ message: "Form already submitted" });
          } else {
            throw e;
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    } else {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
});

router.get("/whitelist", async (req: Request, res: Response) => {
  const whitelist = await prisma.whitelist.findMany();
  const listemail: string[] = [];
  whitelist.forEach((element) => {
    listemail.push(element.email);
  });
  return res.json({ whitelist: listemail });
});

export default router;
