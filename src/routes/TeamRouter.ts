import express from "express";
import { createTeamfn, findTeamfn, joinTeamfn, leaveTeamfn } from "../controllers/team.controller";
const router = express.Router();

router.post('/createteam', createTeamfn)
router.post('/jointeam', joinTeamfn)
router.post('/leaveteam', leaveTeamfn)
router.post('/findteam', findTeamfn)


export default router;