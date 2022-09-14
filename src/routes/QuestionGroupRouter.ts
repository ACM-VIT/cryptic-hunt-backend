import express from "express";
import { getFinalQuestionGroupList } from "../controllers/questionGroup.controller";

const router = express.Router();

router.get("/questiongrouplist", async (req, res) => {
  const finalQuestionGroupList = await getFinalQuestionGroupList(req.user!.id);
  res.json(finalQuestionGroupList);
});
