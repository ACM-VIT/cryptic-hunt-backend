import { prisma } from "../../prisma/prisma";
import bcrypt from "bcrypt";

const submitAnswer = async (
  questionGroupId: string,
  seq: number,
  teamId: string,
  userId: string,
  answer: string
) => {
  const question = await prisma.question.findUnique({
    where: {
      seq_questionGroupId: {
        questionGroupId: questionGroupId,
        seq: 1,
      },
    },
  });

  if (!question) {
    return "Question not found";
  }

  const isCorrect = await bcrypt.compare(answer, question.answer);
  const submission = await prisma.submission.create({
    data: {
      teamId: teamId,
      userId: userId,
      questionGroupId: questionGroupId,
      questionSeq: seq,
      answer: answer,
      isCorrect: isCorrect,
    },
  });

  const questionGroupSubmission =
    await prisma.questionGroupSubmission.findUnique({
      where: {
        teamId_questionGroupId: {
          teamId: teamId,
          questionGroupId: questionGroupId,
        },
      },
    });

  if (!questionGroupSubmission) {
    return "Question group submission not found";
  }

  if (isCorrect) {
    const updateQuestionGroupSubmission =
      await prisma.questionGroupSubmission.update({
        where: {
          teamId_questionGroupId: {
            teamId: teamId,
            questionGroupId: questionGroupId,
          },
        },
        data: {
          numQuestionsCompleted:
            questionGroupSubmission.numQuestionsCompleted + 1,
        },
      });
  }
};

export { submitAnswer };
