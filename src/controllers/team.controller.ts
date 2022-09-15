import { Request, Response } from "express";
import { createTeam, findTeam, joinTeam, leaveTeam } from "../teams/team";
import { u_req } from "../models/req";

// CreateTeam Express fn
export async function createTeamfn(req: u_req, res: Response) {
  try {
    const {teamname} = req.body;
    const userid = req.user.id;

    const team = await createTeam(teamname, userid);
    return res.json(team);
  } catch (error) {
    return res.status(409).json({ error: error });
  }
}

// JoinTeam express fn
export async function joinTeamfn(req: u_req, res: Response) {
  const {teamcode} = req.body;
  const userid = req.user.id;
  try {
    const Jointeam = await joinTeam(teamcode, userid);
    return res.json(Jointeam);
  } catch (e) {
    return res.status(409).json({ error: e });
  }
}

// LeaveTeam express fn
export async function leaveTeamfn(req: u_req, res: Response) {
  const {teamcode} = req.body;
  const userid = req.user.id;
  try {
    const Leave = await leaveTeam(teamcode, userid);
    return res.json(Leave);
  } catch (e) {
    return res.status(409).json({ error: e });
  }
}
// Findteam express fn
export async function findTeamfn(req: u_req, res: Response) {
  const {teamcode} = req.body;
  try {
    const team = await findTeam(teamcode);
    if (team === null) {
      return res.status(500).json({ error: "invalid team id" });
    } else {
      return res.json(team);
    }
  } catch (e) {
    return res.status(401).json({ error: e });
  }
}
