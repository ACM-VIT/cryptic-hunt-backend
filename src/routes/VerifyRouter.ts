import { Response, Router } from "express";
import { prisma } from "..";
import { AuthRequest } from "../types/AuthRequest.type";
const router = Router();
import { readCsv, Record } from "../controllers/verify.controllers";
import { Prisma } from "@prisma/client";

interface EmailType {
  email: string;
  hasWhitelisted: boolean;
}

router.post("/whitelist", async (req: AuthRequest, res: Response) => {
  try {
    const { emails } = req.body as { emails: string[] };
    if (
      !Array.isArray(emails) ||
      emails.length < 1 ||
      typeof emails[0] !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid type of emails",
      });
    }

    const records = await readCsv();
    const user = records.find(
      (record: Record) => record.email === req.user!.email
    );
    const len = user!.paid / 250 - 1;
    let emails_arr: EmailType[] = [];

    emails.forEach((item: string) => {
      let obj: EmailType = { email: "", hasWhitelisted: true };
      obj["email"] = item;
      emails_arr.push(obj);
    });
    if (len != emails_arr.length) {
      return res.status(400).json({
        message: `you can't nominate, you should nominate ${len} users`,
      });
    } else {
      const check = await prisma.whitelist.findMany({
        where: {
          email: req.user!.email,
          hasWhitelisted: true,
        },
      });
      if (check.length > 0) {
        return res.status(409).json({
          message: `user has already nominated!`,
        });
      } else {
        try {
          const whitelist = await prisma.whitelist.createMany({
            data: emails_arr,
            skipDuplicates: true,
          });
          const updateuser = await prisma.whitelist.update({
            where: {
              email: req.user!.email,
            },
            data: {
              hasWhitelisted: true,
            },
          });
          return res.json({ whitelist });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
              return res.json({ message: "users already verified" });
            } else {
              throw e;
            }
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

router.get("/whitelist", async (req: AuthRequest, res: Response) => {
  const whitelist = await prisma.whitelist.findMany();
  const listemail: string[] = [];
  whitelist.forEach((element) => {
    listemail.push(element.email);
  });
  return res.json({ whitelist: listemail });
});

export default router;
