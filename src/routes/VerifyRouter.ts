import { Response, Router } from "express";
import { prisma } from "..";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../types/AuthRequest.type";
const router = Router();
import { readCsv, Record } from "../controllers/verify.controllers";

interface EmailType {
  email: string;
  hasWhitelisted: boolean;
}

router.post("/whitelist", async (req: AuthRequest, res: Response) => {
  // try {
  const { emails } = req.body;

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
    if (check != null) {
      return res.status(409).json({
        message: `user has already nominated!`,
      });
    } else {
      // try {
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
    }
    // } catch (e) {
    //   if (e instanceof Prisma.PrismaClientKnownRequestError) {
    //     if (e.code === "P2002") {
    //       return res.json({ message: "users already verified" });
    //     } else {
    //       throw e;
    //     }
    //   }
    // }
  }
  // } catch (error) {
  //   if (error instanceof Error) {
  //     return res.status(400).json({
  //       message: error.message,
  //     });
  //   }
  // }
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
