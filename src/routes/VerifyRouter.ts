import express from "express";
import { prisma } from "..";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../types/AuthRequest.type";
const router = express.Router();
import { readCsv } from "../controllers/verify.controllers";

router.post("/whitelist", async (req: AuthRequest, res) => {
  try {
    const { emails } = req.body;
    let emails_arr: any[] = [];
    emails.forEach((item: string) => {
      let obj = { email: "" };
      obj["email"] = item;
      emails_arr.push(obj);
    });
    const records: any = await readCsv();
    const user = records.find(
      (record: any) => record.email === req.user!.email
    );
    const len = user.paid / 250 - 1;
    if (len < emails_arr.length) {
      return res.status(400).json({
        message: "you can't nominate more than your paid",
      });
    } else {
      try {
        const whitelist = await prisma.whitelist.createMany({
          data: emails_arr,
          skipDuplicates: true,
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
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }
});

router.get("/whitelist", async (req: AuthRequest, res) => {
  const whitelist = await prisma.whitelist.findMany();
  const listemail: string[] = [];
  whitelist.forEach(async (element: any) => {
    listemail.push(element.email);
  });
  return res.json({ whitelist: listemail });
});

export default router;
