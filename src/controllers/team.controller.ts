import { Prisma, User } from "@prisma/client";
import { prisma } from "..";
import ShortUniqueId from "short-unique-id";
import cache from "../services/cache.service";
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
export async function joinTeam(team_code: string, user: User) {
  try {
    if (user.teamId !== null) {
      // not throwing error here
      throw Error("user is already a part of team");
    }

    const team = cache.get(`team_${user.teamId}`, async () => {
      return await prisma.team.findUnique({
        where: {
          id: user.teamId!,
        },
        include: {
          members: true,
        },
      });
    });
    if (team === null) {
      throw new Error("Team not found");
    }
    if (team.members.length >= MAX_PARTICIPANTS_POSSIBLE) {
      // not throwing error here
      throw Error("the team already has maximum participants");
    } else {
      const joinTeam = await prisma.user.update({
        where: {
          id: user.id,
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
export async function leaveTeam(user: User) {
  try {
    if (user.teamId === null) {
      throw new Error("User is not a part of a team"); // not throwing error here
    } else {
      // find team_code from team id
      const teamId = user.teamId;
      const team = cache.get(`team_${user.teamId}`, async () => {
        return await prisma.team.findUnique({
          where: {
            id: user.teamId!,
          },
          include: {
            members: true,
          },
        });
      });

      // Check if user is team leader
      if (team?.teamLeaderId === user.id) {
        if (team.members.length > 1) {
          await prisma.team.update({
            where: {
              teamcode: teamId,
            },
            data: {
              teamLeaderId: team.members[1].id,
            },
          });
        } else {
          await prisma.team.delete({
            where: {
              teamcode: teamId,
            },
          });
        }
      }
      const leave = await prisma.user.update({
        where: {
          id: user.id,
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
    const team = cache.get(`team_${team_id}`, async () => {
      return await prisma.team.findUnique({
        where: {
          id: team_id!,
        },
        include: {
          members: true,
        },
      });
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

export const getTeamIfTeamOnLeaderboard = async (team_id: string) => {
  const rank = await getRank(team_id);

  if (rank <= 10) {
    return null;
  }

  const team = cache.get(`team_${team_id}`, async () => {
    return await prisma.team.findUnique({
      where: {
        id: team_id!,
      },
      include: {
        members: true,
      },
    });
  });
  return { ...team, rank };
};
