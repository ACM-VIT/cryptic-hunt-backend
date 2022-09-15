import express from "express";
import { AuthRequest } from "../auth";
import { getFinalQuestionGroupList } from "../controllers/questionGroup.controller";

const router = express.Router();

router.get(
  "/questiongrouplist",
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

export default router;
