import { prisma } from "..";
import bcrypt from "bcrypt";

const submitAnswer = async (
  questionGroupId: string,
  seq: number,
  teamId: string,
  userId: string,
  answer: string
) => {
  await prisma.$transaction(async (transactionClient) => {
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
        const updateQuestionGroupSubmission =
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

        const updateTeam = await transactionClient.team.update({
          where: {
            id: teamId,
          },
          data: {
            points: { increment: question.pointsAwarded },
          },
        });

        return {
          submission: submission,
          questionGroupSubmission: updateQuestionGroupSubmission,
          team: updateTeam,
        };
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
