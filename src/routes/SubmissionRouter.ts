import { Request, Response, Router } from "express";
import {
  buyHint,
  getAllSubmissionsForUserById,
  getAllSubmissionsForUsersTeamByQuestionGroup,
  submitAnswer,
} from "../controllers/submission.controller";

const router = Router();

// make submission
router.post("/submit", async (req: Request, res: Response) => {
  const { questionGroupId, seq, answer } = req.body;

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
      req.user,
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
router.post("/buyhint", async (req: Request, res: Response) => {
  const { questionGroupId, seq } = req.body;

  if (typeof questionGroupId !== "string" || typeof seq !== "number") {
    return res.status(400).json({
      message: "Question details found incorrect",
    });
  }

  try {
    const response = await buyHint(req.user, questionGroupId, seq);
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
router.get("/", async (req: Request, res: Response) => {
  const { qgid, qseq } = req.query;

  if (!qgid || !qseq) {
    return res.status(400).json({
      message: "Invalid query",
    });
  }

  // typeof qgid === "string" && typeof qseq === "string"
  if (typeof qgid === "string" && typeof qseq === "string") {
    const submissions = await getAllSubmissionsForUserById(
      req.user.id,
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
router.get("/team", async (req: Request, res: Response) => {
  const { qgid, qseq } = req.query;

  if (!qgid || !qseq) {
    return res.status(400).json({
      message: "Invalid query",
    });
  }

  // typeof qgid === "string" && typeof qseq === "string"
  if (typeof qgid === "string" && typeof qseq === "string") {
    try {
      const submissions = await getAllSubmissionsForUsersTeamByQuestionGroup(
        req.user,
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
