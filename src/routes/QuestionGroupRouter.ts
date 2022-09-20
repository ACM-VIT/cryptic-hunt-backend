import { QuestionGroup } from "@prisma/client";
import express from "express";
import { AuthRequest } from "../auth";
import { uploadQuestionGroup } from "../controllers/admin.controller";
import {
  deleteQuestionGroup,
  getFinalQuestionGroupList,
  getQuestionGroupById,
} from "../controllers/questionGroup.controller";

const router = express.Router();

// GET all question groups
router.get("/", async (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }
  try {
    const questionGroupList = await getFinalQuestionGroupList(req.user.id);

    if (typeof questionGroupList === "string") {
      return res.status(400).json({
        message: questionGroupList,
      });
    }

    res.json(questionGroupList);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
});

// GET question group by id
router.get("/:id", async (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  const specificQuestionGroup = await getQuestionGroupById(
    req.params.id,
    req.user.id
  );
  return res.json(specificQuestionGroup);
});

// CREATE question group
router.post("/", async (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  const { name, description, questions, isSequence } = req.body;

  if (!name || !description || !questions || !isSequence) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  // type check of name, descriptions, isSequence
  if (typeof name !== "string" || typeof description !== "string") {
    return res.status(400).json({
      message: "Invalid type of name or description",
    });
  }

  if (typeof isSequence !== "boolean") {
    return res.status(400).json({
      message: "Invalid type of isSequence",
    });
  }

  // type check of questions

  if (!Array.isArray(questions)) {
    return res.status(400).json({
      message: "Invalid type of questions",
    });
  }

  for (const question of questions) {
    if (typeof question !== "object") {
      return res.status(400).json({
        message: "Invalid type of question",
      });
    }

    const { title, answer, pointsAwarded, description, seq } = question;

    if (
      typeof seq !== "number" ||
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof answer !== "string" ||
      typeof pointsAwarded !== "number"
    ) {
      return res.status(400).json({
        message: "Invalid type of question",
      });
    }
  }

  await uploadQuestionGroup({
    name,
    description,
    questions,
    isSequence,
    numberOfQuestions: questions.length,
  });

  return res.sendStatus(201);
});

// DELETE question group
router.delete("/:id", async (req: AuthRequest, res: express.Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  try {
    const questionGroup = await deleteQuestionGroup(req.params.id);

    return res.status(200).json(questionGroup);
  } catch (error) {
    return res.status(500).json({
      message: `An error occuured :(`,
    });
  }
});

export default router;
