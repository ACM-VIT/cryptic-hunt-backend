import { prisma } from "..";
import express from "express";
import { AuthRequest } from "../auth";
import {
  createTeam,
  joinTeam,
  leaveTeam,
} from "../controllers/team.controller";
const router = express.Router();

router.post("/createteam", async (req: AuthRequest, res) => {
  try {
    const { teamname } = req.body;
    const userid = req.user!.id;

    const team = await createTeam(teamname, userid);
    return res.json(team);
  } catch (error) {
    return res.status(409).json({ error: error });
  }
});
router.post("/jointeam", async (req: AuthRequest, res) => {
  const { teamcode } = req.body;
  const userid = req.user!.id;
  try {
    const updatedUserWithJoinedTeam = await joinTeam(teamcode, userid);
    return res.json(updatedUserWithJoinedTeam);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
  }
});
router.delete("/team", async (req: AuthRequest, res) => {
  const userid = req.user!.id;
  try {
    const leave = await leaveTeam(userid);
    return res.json(leave);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
  }
});
router.get("/team", async (req: AuthRequest, res) => {
  const id = req.user!.id;
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error("user not found");
  }
  console.log(id);
  // if user in team, return team, else return 404
  if (user.team) {
    return res.json(user.team);
  }
  return res.status(404).json({ error: "user not in team" });
});

export default router;
