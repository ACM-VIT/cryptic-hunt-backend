import e, { Response, Router } from "express";
import { AuthRequest } from "../types/AuthRequest.type";
import {
  buyHint,
  getAllSubmissionsForUser,
  getAllSubmissionsForUsersTeamByQuestionGroup,
  submitAnswer,
} from "../controllers/submission.controller";

const router = Router();

// make submission
router.post("/submit", async (req: AuthRequest, res: Response) => {
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

  if (typeof questionGroupId !== "string" || typeof seq !== "number") {
    return res.status(400).json({
      message: "Question details found incorrect",
    });
  }

  if (typeof answer !== "string") {
    return res.status(400).json({
      message: "Answer details found incorrect",
    });
  }

  // strip answer
  const strippedAnswer = answer.trim().toLowerCase();

  try {
    const response = await submitAnswer(
      questionGroupId,
      seq,
      teamId,
      id,
      strippedAnswer
    );

    if (typeof response === "string") {
      return res.status(400).json({
        message: response,
      });
    }

    return res.json(response);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    } else {
      return res.status(400).json({
        message: "Something went wrong",
      });
    }
  }
});

// buy hint
router.post("/buyhint", async (req: AuthRequest, res: Response) => {
  const { questionGroupId, seq } = req.body;
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

  if (typeof questionGroupId !== "string" || typeof seq !== "number") {
    return res.status(400).json({
      message: "Question details found incorrect",
    });
  }

  try {
    const response = await buyHint(user.id, questionGroupId, seq);
    return res.json(response);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    } else {
      return res.sendStatus(500);
    }
  }
});

// GET all submissions for a user
router.get("/", async (req: AuthRequest, res: Response) => {
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
router.get("/team", async (req: AuthRequest, res: Response) => {
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
    try {
      const submissions = await getAllSubmissionsForUsersTeamByQuestionGroup(
        id,
        qgid,
        parseInt(qseq)
      );
      return res.json(submissions);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      } else {
        return res.sendStatus(500);
      }
    }
  } else {
    return res.status(400).json({
      message: "Invalid query",
    });
  }
});

export default router;
