import { Request, Response } from "express";
import { createTeam, findTeam, joinTeam, leaveTeam } from "../teams/team";
import { u_req } from "../models/req";
import { prisma } from "../../prisma/prisma";
import { AuthRequest } from "../auth";

// CreateTeam Express fn
export async function createTeamfn(req: u_req, res: Response) {
  try {
    const { teamname } = req.body;
    const userid = req.user.id;

    const team = await createTeam(teamname, userid);
    return res.json(team);
  } catch (error) {
    return res.status(409).json({ error: error });
  }
}

// JoinTeam express fn
export async function joinTeamfn(req: u_req, res: Response) {
  const { teamcode } = req.body;
  const userid = req.user.id;
  try {
    const updatedUserWithJoinedTeam = await joinTeam(teamcode, userid);
    return res.json(updatedUserWithJoinedTeam);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
  }
}

// LeaveTeam express fn
export async function leaveTeamfn(req: u_req, res: Response) {
  const userid = req.user.id;
  try {
    const leave = await leaveTeam(userid);
    return res.json(leave);
  } catch (e) {
    if (e instanceof Error) {
      return res.status(400).json({ error: e.message });
    }
  }
}
// Findteam express fn
export async function findTeamfn(req: AuthRequest, res: Response) {
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
}
