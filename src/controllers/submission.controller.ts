import { User } from "@prisma/client";
import { prisma } from "..";
import bcrypt from "bcrypt";
import cache from "../services/cache.service";
import logger from "../services/logger.service";

const submitAnswer = async (
  questionGroupId: string,
  seq: number,
  user: User,
  answer: string
) => {
  return await prisma.$transaction(async (transactionClient) => {
    const question = await cache.get(
      `questionGroup_${questionGroupId}_${seq}`,
      async () => {
        return await transactionClient.question.findUnique({
          where: {
            seq_questionGroupId: {
              questionGroupId: questionGroupId,
              seq: seq,
            },
          },
        });
      }
    );

    if (!question) {
      throw new Error("Question not found");
    }

    // Check for existing submissions
    const previousSubmissions = await transactionClient.submission.findMany({
      where: {
        teamId: user.teamId!,
        questionGroupId: questionGroupId,
        questionSeq: seq,
      },
    });

    if (previousSubmissions.length > 0) {
      // Check if any of the submissions have a correct answer
      const correctSubmission = previousSubmissions.find(
        (submission) => submission.isCorrect
      );
      if (correctSubmission) {
        throw new Error("Already submitted correct answer");
      }
    }

    const isCorrect = await bcrypt.compare(answer, question.answer);
    const submission = await transactionClient.submission.create({
      data: {
        teamId: user.teamId!,
        userId: user.id,
        questionGroupId: questionGroupId,
        questionSeq: seq,
        answer: answer,
        isCorrect: isCorrect,
      },
    });

    if (isCorrect) {
      try {
        cache.delStartWith(
          `questionGroupSubmission_${questionGroupId}_${user.teamId}`
        );
        await transactionClient.questionGroupSubmission.update({
          where: {
            teamId_questionGroupId: {
              teamId: user.teamId!,
              questionGroupId: questionGroupId,
            },
          },
          data: {
            numQuestionsCompleted: {
              increment: 1,
            },
          },
        });

        // add points
        await transactionClient.team.update({
          where: {
            id: user.teamId!,
          },
          data: {
            points: { increment: question.pointsAwarded },
          },
        });
        logger.info(`Answer Submitted: ${user.teamId} ${questionGroupId}`);
        return submission;
      } catch (error) {
        logger.error(`Error in submitAnswer: ${error}`);
        throw new Error("Couldn't submit answer");
      }
    }
    return submission;
  });
};

const getAllSubmissionsForUserById = async (
  userId: string,
  questionGroupId: string,
  seq: number
) => {
  const submissions = await prisma.submission.findMany({
    where: {
      userId: userId,
      questionGroupId: questionGroupId,
      questionSeq: seq,
    },
  });

  return submissions;
};

const getAllSubmissionsForUsersTeamByQuestionGroup = async (
  user: User,
  questionGroupId: string,
  seq: number
) => {
  if (!user.teamId) {
    throw new Error("User is not in a team");
  }

  const submissions = await prisma.submission.findMany({
    where: {
      teamId: user.teamId,
      questionGroupId: questionGroupId,
      questionSeq: seq,
    },
  });

  return submissions;
};

const buyHint = async (user: User, questionGroupId: string, seq: number) => {
  return await prisma.$transaction(async (transactionClient) => {
    const question = await cache.get(
      `questionGroup_${questionGroupId}_${seq}`,
      async () => {
        return await transactionClient.question.findUnique({
          where: {
            seq_questionGroupId: {
              questionGroupId: questionGroupId,
              seq: seq,
            },
          },
        });
      }
    );

    if (!question) {
      throw new Error("Question not found");
    }

    if (!user.teamId) {
      throw new Error("User is not in a team");
    }

    const team = await cache.get(`team_${user.teamId}`, async () => {
      return await transactionClient.team.findUnique({
        where: {
          id: user.teamId!,
        },
        include: {
          members: true,
        },
      });
    });

    if (!question.costOfHint || !question.hint) {
      throw new Error("Question does not have a hint");
    }

    if (team!.points < question.costOfHint) {
      throw new Error("Not enough points to buy hint");
    }

    const hintSubmission = await transactionClient.viewedHint.create({
      data: {
        teamId: user.teamId,
        questionGroupId: questionGroupId,
        questionSeq: seq,
      },
    });

    const updateTeam = await transactionClient.team.update({
      where: {
        id: user.teamId,
      },
      data: {
        points: { decrement: question.costOfHint },
      },
    });

    if (updateTeam.points < 0) {
      throw new Error("Not enough points to buy hint");
    }
    return { ...hintSubmission, hint: question.hint };
  });
};

export {
  submitAnswer,
  getAllSubmissionsForUserById,
  getAllSubmissionsForUsersTeamByQuestionGroup,
  buyHint,
};
