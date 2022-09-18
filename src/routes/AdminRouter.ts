import express from "express";
import { AuthRequest } from "../auth";
import {
  updateAllQuestions,
  viewTeams,
  viewUsers,
} from "../controllers/admin.controller";

const router = express.Router();

router.get("/update", async (req, res) => {
  await updateAllQuestions();
  return res.send("Updated");
});
router.get("/users", async (_req: AuthRequest, res) => {
  try {
    return res.json(await viewUsers());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});
router.get("/teams", async (_req: AuthRequest, res) => {
  try {
    return res.json(await viewTeams());
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
});

export default router;
