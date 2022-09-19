import { QuestionGroup } from "@prisma/client";
import { prisma } from "..";

// Retrieve all question groups
const getAllQuestionGroups = async () => {
  const questionGroups = await prisma.questionGroup.findMany({
    select: {
      description: true,
      id: true,
      isSequence: true,
      name: true,
      numberOfQuestions: true,
    },
  });
  return questionGroups;
};

// Check the number of questions solved in a given question group by a given user's team
const numQuestionsSolved = async (
  questionGroup: QuestionGroup,
  userId: string
) => {
  // Fetch user details using the user id
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  // If the user is not found, return false
  if (!user) {
    return "User not found";
  }

  if (user.teamId === null) {
    return "User is not part of a team";
  }

  // Get user team details
  const team = await prisma.team.findUnique({
    where: {
      id: user.teamId,
    },
  });

  if (!team) {
    return "Team not found";
  }

  // Check team questionGroup submissions
  const questionGroupSubmission =
    await prisma.questionGroupSubmission.findUnique({
      where: {
        teamId_questionGroupId: {
          teamId: team.id,
          questionGroupId: questionGroup.id,
        },
      },
    });

  if (!questionGroupSubmission) {
    return "Question group submission not found";
  }

  const numQuestionsSolved = questionGroupSubmission.numQuestionsCompleted;
  return numQuestionsSolved;
};

// Return a list of questionGroups that have an isSolved property with each object
const getFinalQuestionGroupList = async (userId: string) => {
  const questionGroups = await getAllQuestionGroups();
  const finalQuestionGroupList = [];

  for (const questionGroup of questionGroups) {
    const numQuestionsSolvedQuestionGroup = await numQuestionsSolved(
      questionGroup,
      userId
    );

    if (typeof numQuestionsSolvedQuestionGroup === "string") {
      return numQuestionsSolvedQuestionGroup;
    }

    finalQuestionGroupList.push({
      ...questionGroup,
      numQuestionsSolvedQuestionGroup,
    });
  }

  return finalQuestionGroupList;
};

// Check if user has viewed a question's hint
const getUserHasViewedHint = async (
  questionGroupId: string,
  userId: string,
  seq: number
) => {
  // get user's teamId
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      teamId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.teamId) {
    throw new Error("User is not part of a team");
  }

  // look for record in ViewedHint table
  const viewedHint = await prisma.viewedHint.findUnique({
    where: {
      teamId_questionGroupId_questionSeq: {
        teamId: user.teamId,
        questionGroupId,
        questionSeq: seq,
      },
    },
  });

  return !!viewedHint;
};

// Get question group by id
const getQuestionGroupById = async (
  questionGroupId: string,
  userId: string
) => {
  const questionGroup = await prisma.questionGroup.findUnique({
    where: {
      id: questionGroupId,
    },
    include: {
      questions: {
        select: {
          answer: false,
          hint: true,
          costOfHint: true,
          description: true,
          pointsAwarded: true,
          seq: true,
          title: true,
        },
        orderBy: {
          seq: "asc",
        },
      },
    },
  });

  if (!questionGroup) {
    throw new Error("Question group not found");
  }
  // if questionGroup.isSequence = false, return all questions
  if (!questionGroup.isSequence) {
    return questionGroup;
  }
  // else return only the questions that have been solved and one unsolved
  const numQuestionsSolvedQuestionGroup = await numQuestionsSolved(
    questionGroup,
    userId
  );

  if (typeof numQuestionsSolvedQuestionGroup === "string") {
    throw new Error(numQuestionsSolvedQuestionGroup);
  }

  const questions = questionGroup.questions.filter(
    (_question, index) => index <= numQuestionsSolvedQuestionGroup
  );

  // remove hints for questions that have ViewHint false
  for (const question of questions) {
    const userHasViewedHint = await getUserHasViewedHint(
      questionGroup.id,
      userId,
      question.seq
    );
    if (!userHasViewedHint) {
      question.hint = null;
    }
  }

  return {
    ...questionGroup,
    questions,
  };
};

const deleteQuestionGroup = async (questionGroupId: string) => {
  const questionGroup = await prisma.questionGroup.findUnique({
    where: {
      id: questionGroupId,
    },
  });

  if (!questionGroup) {
    throw new Error("Question group not found");
  }

  await prisma.questionGroup.delete({
    where: {
      id: questionGroupId,
    },
  });
};

export { getFinalQuestionGroupList, getQuestionGroupById, deleteQuestionGroup };
