import { Response, Router } from "express";
import { AuthRequest } from "../types/AuthRequest.type";
import { uploadQuestionGroup } from "../controllers/admin.controller";
import {
  deleteQuestionGroup,
  getCurrentPhase,
  getFinalQuestionGroupList,
  getQuestionGroupById,
} from "../controllers/questionGroup.controller";

const router = Router();

// GET all unsolved question groups
router.get("/", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }
  try {
    const questionGroupList = await getFinalQuestionGroupList(req.user);

    if (typeof questionGroupList === "string") {
      return res.status(400).json({
        message: questionGroupList,
      });
    }

    // filter out question groups that are unsolved
    const unsolvedQuestionGroups = questionGroupList.filter(
      (questionGroup) =>
        questionGroup.numQuestionsSolvedQuestionGroup <
        questionGroup.numberOfQuestions
    );

    return res.status(200).json(unsolvedQuestionGroups);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
});

// GET all solved question groups
router.get("/archived", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }
  try {
    const questionGroupList = await getFinalQuestionGroupList(req.user);

    if (typeof questionGroupList === "string") {
      return res.status(400).json({
        message: questionGroupList,
      });
    }

    // filter out question groups that are already solved
    const solvedQuestionGroups = questionGroupList.filter(
      (questionGroup) =>
        questionGroup.numQuestionsSolvedQuestionGroup ===
        questionGroup.numberOfQuestions
    );

    return res.status(200).json(solvedQuestionGroups);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
});

// GET current phase
router.get("/current-phase", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  try {
    const currentPhase = await getCurrentPhase();

    return res.status(200).json(currentPhase);
  } catch (error) {
    return res.status(500).json({
      message: `An error occuured :(`,
    });
  }
});

// GET question group by id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User not found",
    });
  }
  try {
    const specificQuestionGroup = await getQuestionGroupById(
      req.params.id,
      req.user
    );
    console.log(specificQuestionGroup);
    return res.json(specificQuestionGroup);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Question group not found") {
        return res.status(404).json({
          message: error.message,
        });
      }
      return res.status(400).json({
        message: error.message,
      });
    }
  }
});

// CREATE question group
router.post("/", async (req: AuthRequest, res: Response) => {
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
  try {
    await uploadQuestionGroup({
      name,
      description,
      questions,
      isSequence,
      numberOfQuestions: questions.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    } else {
      return res.status(500).json({
        message: "Unknown error",
      });
    }
  }

  return res.sendStatus(201);
});

// DELETE question group
router.delete("/:id", async (req: AuthRequest, res: Response) => {
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
