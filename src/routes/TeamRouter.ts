import { prisma } from "..";
import { Request, Response, Router } from "express";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getRank,
  getTeamIfTeamOnLeaderboard,
} from "../controllers/team.controller";
import cache from "../services/cache.service";
import logger from "../services/logger.service";
import { Team, User } from "@prisma/client";

const router = Router();

router.post("/createteam", async (req: Request, res: Response) => {
  try {
    const { teamname } = req.body;
    const userid = req.user.id;

    const team = await createTeam(teamname, userid);
    return res.json(team);
  } catch (error) {
    return res.status(409).json({ error: error });
  }
});
router.post("/jointeam", async (req: Request, res: Response) => {
  const { teamcode } = req.body;

  try {
    const updatedUserWithJoinedTeam = await joinTeam(teamcode, req.user);
    cache.del(`team_${updatedUserWithJoinedTeam.teamId}`);
    logger.info(`Deleted team_${updatedUserWithJoinedTeam.teamId} cache`);
    return res.json(updatedUserWithJoinedTeam);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
  }
});
router.delete("/", async (req: Request, res: Response) => {
  logger.info(`User ${req.user.id} is leaving team ${req.user.teamId}`);
  try {
    const leave = await leaveTeam(req.user);
    cache.del(`team_${req.user.teamId}`);
    logger.info(`Deleted team_${req.user.teamId} cache`);
    return res.json(leave);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
  }
});
router.get("/", async (req: Request, res: Response) => {
  // if user in team, return team, else return 404
  if (req.user.teamId) {
    // Get team rank
    const teamRank = await getRank(req.user.teamId);

    // Get team

    // check cache
    const team = cache.get<
      Team & {
        members: User[];
      }
    >(`team_${req.user.teamId}`);

    if (team) {
      return res.json({ ...team, rank: teamRank });
    }

    // if not, retrieve from db
    const teamFromDb = await prisma.team.findUnique({
      where: {
        id: req.user.teamId,
      },
      include: {
        members: true,
      },
    });

    if (!teamFromDb) {
      return res.status(404).json({ error: "Team not found" });
    }

    // set cache
    cache.set(`team_${req.user.teamId}`, teamFromDb);

    return res.json({ ...teamFromDb, rank: teamRank });
  }
  return res.status(404).json({ error: "User not in team" });
});

// leaderboard, top 10 teams by points and updatedAt
router.get("/leaderboard", async (req: Request, res: Response) => {
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
    team: getTeamIfTeamOnLeaderboard(req.user.teamId!),
  });
});

export default router;
