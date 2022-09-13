import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

// creating a team
export async function createTeam(teamName: string, user_id: string) {
  try {
    const team_code = (Math.random() + 1) //random string
      .toString(36)
      .substring(6)
      .toUpperCase();
    const newTeam = await prisma.team.create({
      data: {
        teamcode: team_code,
        name: teamName,
        teamLeader: { connect: { id: user_id } },
        members: { connect: { id: user_id } },
      },
    });
    return newTeam;
   } catch (e) {
     if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2014'){
       throw ("the user is already in a team");
    }
  }
}}

// joining a team
export async function joinTeam(team_id : string,team_code: string, user_id: string) {
  try {
    const alreadyMember = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select : {
        teamId : true,
        teamLeading : true,
      }
    })
    const teamMember = await prisma.user.findMany({
      where:{
        teamId : team_id,
      }}
    )
    if (alreadyMember?.teamId !== null){ // not throwing error here
      throw Error("user is already a part of team")
    }
    if (teamMember.length >= 4) {
      // not throwing error here
      throw Error("the team already has maximum participants");
    }
    else{
      const joinTeam = await prisma.user.update({
        where: {
          id: user_id,
        },
        data: {
          team: {
            connect: {
              teamcode: team_code,
            },
          },
        },
      });
      return joinTeam;}}
   catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError){
    if (e.code === 'P2025'){
      throw ("no team like this exists")
    }
    }
}}

// leaving a team
export async function leaveTeam(team_id: string, user_id: string) {
   try {
    const alreadyMember = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select: {
        teamId: true,
        teamLeading: true,
      },
    });
    if (alreadyMember?.teamId === null) {
          throw new Error("User is not a part of a team"); // not throwing error here
    } else {
      if (alreadyMember?.teamLeading !== null) {
        const userTeam = await prisma.user.findMany({
          where: {
            teamId: team_id,
          },
          orderBy: {
            updatedAt: "asc",
          },
        });
        if (userTeam.length > 1) {
          const updatingTeam = await prisma.team.update({
            where: {
              id: team_id,
            },
            data: {
              teamLeaderId: userTeam[1].id,
            },
          });
        } else {
          await prisma.team.delete({
            where: {
              id: team_id,
            },
          });
        }
      }
        const leave = await prisma.user.update({
          where: {
            id: user_id,
          },
          data: {
            team: {
              disconnect: true,
            },
          },
        });
        return leave;
    }}
     catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError){
        return e
      }
    
  }
}

// finding team
export async function findTeam(teamID: string) {
  const team = await prisma.team.findUnique({
    where: {
      id: teamID,
    },
  });
  return team
}