import express from "express";
import {
  createTeamfn,
  findTeamfn,
  joinTeamfn,
  leaveTeamfn,
} from "../controllers/team.controller";
const router = express.Router();

router.post("/createteam", createTeamfn);
router.post("/jointeam", joinTeamfn);
router.delete("/", leaveTeamfn);
router.get("/", findTeamfn);

export default router;
