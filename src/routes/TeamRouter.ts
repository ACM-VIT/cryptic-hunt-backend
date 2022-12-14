import { prisma } from "..";
import { Request, Response, Router } from "express";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getRank,
  getTeamIfTeamOnLeaderboard,
} from "../controllers/team.controller";

import logger from "../services/logger.service";

const router = Router();

router.post("/createteam", async (req: Request, res: Response) => {
  try {
    const { teamname } = req.body;
    const userid = req.user.id;

    const team = await createTeam(teamname, userid);
    return res.json(team);
  } catch (error) {
    return res.status(409).json({ message: error });
  }
});
router.post("/jointeam", async (req: Request, res: Response) => {
  const { teamcode } = req.body;

  try {
    const updatedUserWithJoinedTeam = await joinTeam(teamcode, req.user);
    return res.json(updatedUserWithJoinedTeam);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ message: e.message });
    }
  }
});
router.delete("/", async (req: Request, res: Response) => {
  logger.info(`User ${req.user.id} is leaving team ${req.user.teamId}`);
  try {
    const leave = await leaveTeam(req.user);
    return res.json(leave);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ message: e.message });
    }
  }
});
router.get("/", async (req: Request, res: Response) => {
  // if user in team, return team, else return 404
  if (req.user.teamId) {
    // Get team rank
    const teamRank = await getRank(req.user.teamId);
    const team = await prisma.team.findUnique({
      where: {
        id: req.user.teamId!,
      },
      include: {
        members: true,
      },
    });
    return res.json({ ...team, rank: teamRank });
  }
  return res.status(404).json({ message: "user not in team" });
});

// leaderboard, top 10 teams by points and updatedAt
router.get("/leaderboard", async (req: Request, res: Response) => {
  if (req.user.teamId === null) {
    return res.status(404).json({ message: "user not in team" });
  }

  const teams = await prisma.team.findMany({
    take: 10,
    orderBy: [
      { points: "desc" },
      {
        updatedAt: "asc",
      },
    ],
  });

  return res.json({
    leaderboard: teams,
    team: await getTeamIfTeamOnLeaderboard(req.user.teamId),
  });
});

export default router;
