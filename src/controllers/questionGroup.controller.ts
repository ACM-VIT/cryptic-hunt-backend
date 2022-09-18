import { QuestionGroup } from "@prisma/client";
import { prisma } from "../../prisma/prisma";

// Retrieve all question groups
const getAllQuestionGroups = async () => {
  const questionGroups = await prisma.questionGroup.findMany({
    select: {
      description: true,
      id: true,
      isSequence: true,
      name: true,
      numberOfQuestions: true,
      questions: {
        select: {
          answer: false,
          description: true,
          pointsAwarded: true,
          seq: true,
          title: true,
        },
      },
    },
  });
  console.log(questionGroups);
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
          questionGroupId: questionGroup.id!,
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

export { getFinalQuestionGroupList };
