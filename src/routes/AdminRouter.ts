import { Request, Response, Router } from "express";
import {
  updateAllQuestions,
  viewTeams,
  viewUsers,
  getSubmissionAnalysis,
} from "../controllers/admin.controller";
import { readCsv, Record } from "../controllers/verify.controllers";
import { prisma } from "..";
import cache from "../services/cache.service";
import logger from "../services/logger.service";
const router = Router();

router.get("/update", async (req: Request, res: Response) => {
  try {
    await updateAllQuestions();
    logger.info("Deleted QuestionGroups Cache ", cache.del("questionGroups"));

    return res.json({ message: "Updated" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/users", async (req: Request, res: Response) => {
  try {
    return res.json(await viewUsers());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/users/count", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.json({ count: users.length });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/teams", async (req: Request, res: Response) => {
  try {
    return res.json(await viewTeams());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/teams/count", async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany();
    return res.json({ count: teams.length });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/submissions/count", async (req: Request, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany();
    return res.json({ count: submissions.length });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/submissions/accuracy", async (req: Request, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany();
    const correct = submissions.filter((sub) => sub.isCorrect).length;
    const percentage = (correct / submissions.length) * 100;
    // convert to 2 decimal places
    return res.json({ accuracy: percentage.toFixed(2) });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/submissions/analysis", async (req: Request, res: Response) => {
  try {
    return res.json(await getSubmissionAnalysis());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

router.get("/whitelistupdate", async (req, res) => {
  try {
    const users: Record[] = await readCsv();
    await prisma.whitelist.createMany({
      data: users.map((v) => ({
        email: v.email,
      })),
      skipDuplicates: true,
    });

    return res.status(200).json({ message: "done" });
  } catch (error) {
    return res.sendStatus(500).json({ error: "Error in reading CSV" });
  }
});

router.get("/flush", async (req, res) => {
  cache.flush();
  logger.info("Cached Flushed Successfully");
  return res.status(200).json({ message: "done" });
});
export default router;
