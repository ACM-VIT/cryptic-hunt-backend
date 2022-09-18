import express from "express";
import { AuthRequest } from "../auth";
import {
  getFinalQuestionGroupList,
  getQuestionGroupById,
} from "../controllers/questionGroup.controller";

const router = express.Router();

// GET all question groups
router.get(
  "/questiongroup",
  async (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const questionGroupList = await getFinalQuestionGroupList(req.user.id);
    res.json(questionGroupList);
  }
);

// GET question group by id
router.get(
  "/questiongroup/:id",
  async (req: AuthRequest, res: express.Response) => {
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
  }
);

export default router;
