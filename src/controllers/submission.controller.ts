import express from "express";
import { AuthRequest } from "../auth";

const router = express.Router();

// make submission
router.post("/", (req: AuthRequest, res) => {
  //  const {};
  return res.send("make submission");
});
