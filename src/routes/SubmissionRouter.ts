import express from "express";
import { AuthRequest } from "../auth";
import {
  getAllSubmissionsForUser,
  getAllSubmissionsForUsersTeamByQuestionGroup,
  submitAnswer,
} from "../controllers/submission.controller";

const router = express.Router();

// make submission
router.post("/submit", async (req: AuthRequest, res: express.Response) => {
  const { questionGroupId, seq, answer } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  if (user.teamId === null) {
    return res.status(401).json({
      message: "User is not part of a team",
    });
  }

  const { id, teamId } = user;

  const response = await submitAnswer(questionGroupId, seq, teamId, id, answer);

  if (typeof response === "string") {
    return res.status(400).json({
      message: response,
    });
  }

  res.json(response);
});

// GET all submissions for a user
router.get("/", async (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  const { qgid, qseq } = req.query;

  if (!qgid || !qseq) {
    return res.status(400).json({
      message: "Invalid query",
    });
  }

  const { id } = req.user;

  // typeof qgid === "string" && typeof qseq === "string"
  if (typeof qgid === "string" && typeof qseq === "string") {
    const submissions = await getAllSubmissionsForUser(
      id,
      qgid,
      parseInt(qseq)
    );
    return res.json(submissions);
  } else {
    return res.status(400).json({
      message: "Invalid query",
    });
  }
});

// GET all submissions for a user's team
router.get("/team", async (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  const { qgid, qseq } = req.query;

  if (!qgid || !qseq) {
    return res.status(400).json({
      message: "Invalid query",
    });
  }

  const { id } = req.user;

  // typeof qgid === "string" && typeof qseq === "string"
  if (typeof qgid === "string" && typeof qseq === "string") {
    const submissions = await getAllSubmissionsForUsersTeamByQuestionGroup(
      id,
      qgid,
      parseInt(qseq)
    );
    return res.json(submissions);
  } else {
    return res.status(400).json({
      message: "Invalid query",
    });
  }
});

export default router;
