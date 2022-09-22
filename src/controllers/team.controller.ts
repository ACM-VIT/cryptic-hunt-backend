import { Prisma } from "@prisma/client";
import { prisma } from "..";
import ShortUniqueId from "short-unique-id";
const MAX_PARTICIPANTS_POSSIBLE = 4;
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
    // check if user trying to join is already in a team
    const alreadyMember = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select: {
        teamId: true,
        teamLeading: true,
      },
    });
    if (alreadyMember?.teamId !== null) {
      // not throwing error here
      throw Error("user is already a part of team");
    }

    const team = await prisma.team.findUnique({
      where: {
        teamcode: team_code,
      },
      include: {
        members: true,
      },
    });
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.members.length >= MAX_PARTICIPANTS_POSSIBLE) {
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
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("something went wrong");
  }
}

// leaving a team
export async function leaveTeam(user_id: string) {
  try {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select: {
        teamId: true,
        teamLeading: true,
        team: true,
      },
    });
    if (currentUser?.teamId === null) {
      throw new Error("User is not a part of a team"); // not throwing error here
    } else {
      // find team_code from team id
      const team_code = currentUser?.team?.teamcode;
      if (currentUser?.teamLeading !== null) {
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
    } else if (e instanceof Error) {
      throw Error(e.message);
    } else {
      throw e;
    }
  }
}

export async function getRank(team_id: string) {
  try {
    const team = await prisma.team.findUnique({
      where: {
        id: team_id,
      },
      select: {
        points: true,
      },
    });
    // if points are same than order by time
    const teams = await prisma.team.findMany({
      where: {
        points: {
          gte: team?.points,
        },
      },
      orderBy: [
        { points: "desc" },
        {
          updatedAt: "asc",
        },
      ],
    });
    return teams.length;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      throw "an error occured while getting rank";
    } else if (e instanceof Error) {
      throw Error(e.message);
    } else {
      throw e;
    }
  }
}
