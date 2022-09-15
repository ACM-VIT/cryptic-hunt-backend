import express from "express";
import { AuthRequest } from "../auth";
import { submitAnswer } from "../controllers/submission.controller";

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

export default router;
