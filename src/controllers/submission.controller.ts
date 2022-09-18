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
        seq: seq,
      },
    },
  });

  if (!question) {
    return "Question not found";
  }

  // Check for existing submissions
  const previousSubmissions = await prisma.submission.findMany({
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
      return "Correct answer already submitted";
    }
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

  return submission;
};

export { submitAnswer };
