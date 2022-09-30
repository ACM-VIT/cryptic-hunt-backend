import { Request, Response, Router } from "express";
import { prisma } from "..";
import { readCsv, Record } from "../controllers/verify.controllers";
import { Prisma } from "@prisma/client";
import logger from "../services/logger.service";

const router = Router();

interface whitelistType {
  email: string;
  regno: string;
  name: string;
  mobile: string;
  college: string;
  appleId: string;
}

router.post("/whitelist", async (req: Request, res: Response) => {
  try {
    // If user not in whitelisted table
    const whitelist = await prisma.whitelist.findUnique({
      where: {
        email: req.user.email,
      },
    });
    if (!whitelist) {
      return res.status(403).json({ message: "Not Whitelisted" });
    }

    if (whitelist.hasWhitelisted) {
      return res.status(403).json({ message: "Already Submitted the form" });
    }

    const { data } = req.body as { data: whitelistType[] };

    const records = await readCsv();
    const user = records.find(
      (record: Record) => record.email === req.user!.email
    );
    const len = user!.paid;

    if (len != data.length) {
      return res.status(400).json({
        message: `you can't nominate, you should nominate ${
          len - 1
        } more users`,
      });
    }

    if (data[0].email !== req.user.email) {
      return res.status(400).json({
        message: `User's email not found`,
      });
    }
    return await prisma.$transaction(async (transactionClient) => {
      // Update existing user
      const { regno, name, mobile, college, appleId } = data[0];
      console.log(regno, name, mobile, college);
      try {
        const updateUser = await transactionClient.whitelist.update({
          where: {
            email: req.user.email,
          },
          data: {
            regno,
            name,
            mobile,
            college,
            appleId,
            hasWhitelisted: true,
          },
        });
      } catch (e) {
        logger.error(`Error updating user ${req.user.email}`);
        throw new Error("Error updating user");
      }
      // delete first object from data
      data.shift();
      for (let i = 1; i < data.length; i++) {
        const item = data[i];
        if (typeof item !== "object") {
          throw new Error("Invalid data");
        }

        const { email, regno, name, mobile, college } = item;
        const check = await transactionClient.whitelist.findMany({
          where: {
            email,
            hasWhitelisted: true,
          },
        });

        if (check.length > 0) {
          throw new Error(`User ${email} already whitelisted`);
        }
      }
      try {
        // whitelisted is true
        await transactionClient.whitelist.createMany({
          data: data.map((item) => ({
            email: item.email,
            regno: item.regno,
            name: item.name,
            mobile: item.mobile,
            college: item.college,
            appleId: item.appleId,
            hasWhitelisted: true,
          })),
        });

        logger.info(`User ${req.user.email} nominated ${data.length} users`);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            logger.error(`User ${req.user.email} already nominated`);
            throw new Error(`Error creating user ${req.user.email}`);
          } else {
            throw e;
          }
        }
      }
      logger.info(`User ${req.user.email} updated`);
      return res.json({ message: "Form submitted successfully" });
    });
  } catch (error) {
    logger.error(`Error in whitelist by ${req.user.email}`);
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

router.get("/getDetails", async (req: Request, res: Response) => {
  try {
    const whitelist = await prisma.whitelist.findUnique({
      where: {
        email: req.user.email,
      },
    });
    if (!whitelist) {
      return res.status(403).json({ message: "Not Whitelisted" });
    }

    const { data } = req.body as { data: whitelistType[] };

    const records = await readCsv();
    const user = records.find(
      (record: Record) => record.email === req.user!.email
    );
    const len = user!.paid;
    return res.json({
      email: req.user.email,
      name: req.user.name,
      paidFor: len,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.json({ message: "Some error occured" });
      } else {
        // this line crashed the server
        return res.status(500).json({
          message: "Internal Server Error",
        });
      }
    } else {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
});

// router.get("/whitelist", async (req: Request, res: Response) => {
//   const whitelist = await prisma.whitelist.findMany();
//   const listemail: string[] = [];
//   whitelist.forEach((element) => {
//     listemail.push(element.email);
//   });
//   return res.json({ whitelist: listemail });
// });

export default router;
