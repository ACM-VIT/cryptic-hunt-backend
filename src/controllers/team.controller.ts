import { Request, Response } from "express";
import { createTeam, findTeam, joinTeam, leaveTeam } from "../teams/team";

// CreateTeam Express fn
export async function createTeamfn(req: Request, res: Response) {
  try{
  const {teamname, userid} = req.body
  
    const team = await createTeam(teamname, userid);
    res.json(team);
  }
  catch (error){
    res.status(500).json({"error": error});
  
}}

// JoinTeam express fn
export async function joinTeamfn(req: Request, res: Response) {
  const {teamcode, userid} = req.body;
  try {
    const Jointeam = await joinTeam(teamcode, userid);
    res.json(Jointeam); 
  } catch (e) {
    res.status(500).json({"error" : e})
}
}

// LeaveTeam express fn
export async function leaveTeamfn(req: Request, res: Response) {
  const {teamid, userid} = req.body;
  try {
    const Leave = await leaveTeam(teamid, userid);
    res.json(Leave);
  } catch (e) {
    res.status(500).json({"error" : e});
  }
}
// Findteam express fn
export async function findTeamfn(req: Request, res: Response) {
  const {teamid} = req.body
  try {
    const team = await findTeam(teamid);
    if (team === null){
      res.status(500).json({"error" : "invalid team id"})
    }
    else{
    res.json(team);
    }
  } catch (e) {
    res.status(500).json({"error" : e});
  }
}
