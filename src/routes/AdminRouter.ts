import express from "express";
import { storage, listFiles } from "../firebase/firebase";

const router = express.Router();

router.post("/admin/refreshQuestions", async (req, res) => {
  const files = await listFiles();
  const questions = files.map((file) => file.name);
  res.json(questions);
});

export default router;
