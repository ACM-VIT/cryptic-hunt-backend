import express from "express";
import { updateAllQuestions } from "../controllers/admin.controller";

const router = express.Router();

router.get("/update", async (req, res) => {
  await updateAllQuestions();
  res.send("Updated");
});

export default router;
