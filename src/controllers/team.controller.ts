import { Request , Response } from "express";
import { createTeam, findTeam, joinTeam, leaveTeam } from "../teams/team";
import { u_req } from "../models/req";


// CreateTeam Express fn
export async function createTeamfn(req: u_req, res: Response) {
  try {
    const teamname = req.body.teamname;
    const userid = req.user.id;

    const team = await createTeam(teamname, userid);
    res.json(team);
  } catch (error) {
    res.status(409).json({ error: error });
  }
}

// JoinTeam express fn
export async function joinTeamfn(req: u_req, res: Response) {
  const teamcode = req.body.teamcode
  const userid = req.user.id
  try {
    const Jointeam = await joinTeam(teamcode, userid);
    res.json(Jointeam);
  } catch (e) {
    res.status(409).json({ error: e });
  }
}

// LeaveTeam express fn
export async function leaveTeamfn(req: u_req, res: Response) {
  const teamcode = req.body.teamcode;
  const userid = req.user.id;
  try {
    const Leave = await leaveTeam(teamcode, userid);
    res.json(Leave);
  } catch (e) {
    res.status(409).json({ error: e });
  }
}
// Findteam express fn
export async function findTeamfn(req: u_req, res: Response) {
  const teamcode  = req.body.teamcode;
  try {
    const team = await findTeam(teamcode);
    if (team === null) {
      res.status(500).json({ error: "invalid team id" });
    } else {
      res.json(team);
    }
  } catch (e) {
    res.status(401).json({ error: e });
  }
}
