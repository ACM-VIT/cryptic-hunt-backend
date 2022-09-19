import { prisma } from "..";
import express from "express";
import { AuthRequest } from "../auth";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getRank,
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
router.delete("/", async (req: AuthRequest, res) => {
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
router.get("/", async (req: AuthRequest, res) => {
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
    // Get team rank
    const teamRank = await getRank(user.team.id);
    return res.json({ ...user.team, rank: teamRank });
  }
  return res.status(404).json({ error: "user not in team" });
});

// leaderboard, top 10 teams by points and updatedAt
router.get("/leaderboard", async (req, res) => {
  const teams = await prisma.team.findMany({
    take: 10,
    orderBy: [
      { points: "desc" },
      {
        updatedAt: "asc",
      },
    ],
  });

  return res.json(teams);
});

export default router;
