import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();
import ShortUniqueId from "short-unique-id";
// unique code
async function getRandomCode() {
  const shortUniqueInstance = new ShortUniqueId({ length: 6 });
  const code = shortUniqueInstance();
  const codeString = code.toString();
  return codeString;
}
// creating a team
export async function createTeam(teamName: string, user_id: string) {
  try {
    const team_code = await getRandomCode();
    const newTeam = await prisma.team.create({
      data: {
        teamcode: team_code,
        name: teamName,
        teamLeader: { connect: { id: user_id } },
        members: { connect: { id: user_id } },
      },
    });
    const questionGroups = await prisma.questionGroup.findMany();
    const questionGroupIds = questionGroups.map((qg) => qg.id);
    const teamQuestionGroups = questionGroupIds.map((qgId) => {
      return {
        teamId: newTeam.id,
        questionGroupId: qgId,
      };
    });
    await prisma.questionGroupSubmission.createMany({
      data: teamQuestionGroups,
    });
    return newTeam;
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2014") {
        throw "the user is already in a team";
      } else {
        throw e;
      }
    }
  }
}

// joining a team
export async function joinTeam(team_code: string, user_id: string) {
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
    const teamMember = await prisma.user.findMany({
      where: {
        team: {
          teamcode: team_code,
        },
      },
    });
    if (alreadyMember?.teamId !== null) {
      // not throwing error here
      throw Error("user is already a part of team");
    }
    if (teamMember.length >= 4) {
      // not throwing error here
      throw Error("the team already has maximum participants");
    } else {
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
      return joinTeam;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        throw "no team like this exists";
      }
    }
  }
}

// leaving a team
export async function leaveTeam(team_code: string, user_id: string) {
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
            team: {
              teamcode: team_code,
            },
          },
          orderBy: {
            updatedAt: "asc",
          },
        });
        if (userTeam.length > 1) {
          const updatingTeam = await prisma.team.update({
            where: {
              teamcode: team_code,
            },
            data: {
              teamLeaderId: userTeam[1].id,
            },
          });
        } else {
          await prisma.team.delete({
            where: {
              teamcode: team_code,
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
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      throw "an error occured while leaving";
    } else {
      throw "an error occured while processing the request";
    }
  }
}

// finding team
export async function findTeam(team_code: string) {
  const team = await prisma.team.findUnique({
    where: {
      teamcode: team_code,
    },
  });
  return team;
}
