import { prisma } from "..";
import bcrypt from "bcrypt";

const submitAnswer = async (
  questionGroupId: string,
  seq: number,
  teamId: string,
  userId: string,
  answer: string
) => {
  return await prisma.$transaction(async (transactionClient) => {
    const question = await transactionClient.question.findUnique({
      where: {
        seq_questionGroupId: {
          questionGroupId: questionGroupId,
          seq: seq,
        },
      },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    // Check for existing submissions
    const previousSubmissions = await transactionClient.submission.findMany({
      where: {
        teamId: teamId,
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
        teamId: teamId,
        userId: userId,
        questionGroupId: questionGroupId,
        questionSeq: seq,
        answer: answer,
        isCorrect: isCorrect,
      },
    });

    if (isCorrect) {
      try {
        await transactionClient.questionGroupSubmission.update({
          where: {
            teamId_questionGroupId: {
              teamId: teamId,
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
            id: teamId,
          },
          data: {
            points: { increment: question.pointsAwarded },
          },
        });

        return submission;
      } catch (error) {
        throw new Error("Couldn't submit answer");
      }
    }

    return submission;
  });
};

const getAllSubmissionsForUser = async (
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
  userId: string,
  questionGroupId: string,
  seq: number
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

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

export {
  submitAnswer,
  getAllSubmissionsForUser,
  getAllSubmissionsForUsersTeamByQuestionGroup,
};

export const buyHint = async (
  userId: string,
  questionGroupId: string,
  seq: number
) => {
  return await prisma.$transaction(async (transactionClient) => {
    const question = await transactionClient.question.findUnique({
      where: {
        seq_questionGroupId: {
          questionGroupId: questionGroupId,
          seq: seq,
        },
      },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    const user = await transactionClient.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.teamId) {
      throw new Error("User is not in a team");
    }

    const team = await transactionClient.team.findUnique({
      where: {
        id: user.teamId,
      },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    if (!question.costOfHint || !question.hint) {
      throw new Error("Question does not have a hint");
    }

    if (team.points < question.costOfHint) {
      throw new Error("Not enough points to buy hint");
    }

    const hintSubmission = await transactionClient.viewedHint.create({
      data: {
        teamId: team.id,
        questionGroupId: questionGroupId,
        questionSeq: seq,
      },
    });

    const updateTeam = await transactionClient.team.update({
      where: {
        id: team.id,
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
