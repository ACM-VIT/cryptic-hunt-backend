import { Response, Router } from "express";
import { AuthRequest } from "../types/AuthRequest.type";
import {
  updateAllQuestions,
  viewTeams,
  viewUsers,
} from "../controllers/admin.controller";
import { readCsv } from "../controllers/verify.controllers";
import { prisma } from "..";
const router = Router();

router.get("/update", async (req: AuthRequest, res: Response) => {
  try {
    await updateAllQuestions();
    return res.json({ message: "Updated" });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await viewUsers());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});
router.get("/teams", async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await viewTeams());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});
router.get("/whitelistupdate", async (req, res) => {
  const users: any = await readCsv();
  const user = users.forEach(async (user: any) => {
    await prisma.whitelist.createMany({
      data: [
        {
          email: user.email,
        },
      ],
      skipDuplicates: true,
    });
  });
  res.json({ message: "done" });
});
export default router;
