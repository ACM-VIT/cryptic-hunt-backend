import { QuestionGroup, User } from "@prisma/client";
import { prisma } from "..";

import logger from "../services/logger.service";

// Retrieve all question groups
const getAllQuestionGroups = async () => {
  const questionGroups = await prisma.questionGroup.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return questionGroups;
};

// Check the number of questions solved in a given question group by a given user's team
const numQuestionsSolved = async (questionGroup: QuestionGroup, user: User) => {
  if (user.teamId === null) {
    return "User is not part of a team";
  }

  // Check team questionGroup submissions
  const questionGroupSubmission =
    await prisma.questionGroupSubmission.findUnique({
      where: {
        teamId_questionGroupId: {
          teamId: user.teamId!,
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

// get current phase score
const getCurrentPhaseScore = async () => {
  const currentPhase = await prisma.liveConfig.findFirst({
    select: {
      currentPhase: true,
    },
  });

  if (!currentPhase) {
    throw new Error("Current phase not found");
  }

  return currentPhase.currentPhase;
};

// Return a list of questionGroups that have an isSolved property with each object
const getFinalQuestionGroupList = async (user: User) => {
  const questionGroups = await getAllQuestionGroups();
  const finalQuestionGroupList = [];

  for (const questionGroup of questionGroups) {
    const numQuestionsSolvedQuestionGroup = await numQuestionsSolved(
      questionGroup,
      user
    );

    if (typeof numQuestionsSolvedQuestionGroup === "string") {
      throw new Error(numQuestionsSolvedQuestionGroup);
    }

    finalQuestionGroupList.push({
      ...questionGroup,
      numQuestionsSolvedQuestionGroup,
    });
  }

  const currentPhaseScore = await getCurrentPhaseScore();

  // OPTIONAL FEATURE - sort the question groups by the number of questions solved

  // filter according to phase score
  const filteredQuestionGroups = finalQuestionGroupList.filter(
    (questionGroup) => questionGroup.phase <= currentPhaseScore
  );

  return filteredQuestionGroups;
};

// Check if user has viewed a question's hint
const getUserHasViewedHint = async (
  questionGroupId: string,
  user: User,
  seq: number
) => {
  if (!user.teamId) {
    throw new Error("User is not part of a team");
  }

  // look for record in ViewedHint table
  const viewedHint = await prisma.viewedHint.findUnique({
    where: {
      teamId_questionGroupId_questionSeq: {
        teamId: user.teamId!,
        questionGroupId,
        questionSeq: seq,
      },
    },
  });

  return !!viewedHint;
};

type Question = {
  hint: string | null;
  costOfHint: number | null;
  description: string;
  pointsAwarded: number;
  seq: number;
  title: string;
  solved: boolean;
};

// getTeamHasSolvedSpecificQuestion
const getTeamHasSolvedSpecificQuestion = async (
  questionGroupId: string,
  user: User,
  seq: number
) => {
  if (!user.teamId) {
    throw new Error("User is not part of a team");
  }

  // look for record in submissions table with correct answer
  const correctSubmissions = await prisma.submission.findMany({
    where: {
      AND: [
        {
          teamId: user.teamId,
        },
        {
          questionGroupId,
        },
        {
          questionSeq: seq,
        },
        {
          isCorrect: true,
        },
      ],
    },
  });

  return correctSubmissions.length > 0;
};

// Get question group by id
const getQuestionGroupById = async (questionGroupId: string, user: User) => {
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
          images: true,
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

  let subQuestions: Question[] =
    questionGroup.questions.map((q: any) => ({ ...q, solved: false })) || [];

  // if questionGroup.isSequence = false, return all questions
  if (questionGroup.isSequence) {
    // else return only the questions that have been solved and one unsolved
    const numQuestionsSolvedQuestionGroup = await numQuestionsSolved(
      questionGroup,
      user
    );

    if (typeof numQuestionsSolvedQuestionGroup === "string") {
      throw new Error(numQuestionsSolvedQuestionGroup);
    }

    subQuestions = subQuestions.filter(
      (_question, index) => index <= numQuestionsSolvedQuestionGroup
    );
  }
  // remove hints for questions that have ViewHint false
  for (const question of subQuestions) {
    const userHasViewedHint = await getUserHasViewedHint(
      questionGroup.id,
      user,
      question.seq
    );
    if (!userHasViewedHint) {
      question.hint = null;
    }
  }

  // add solved property to each question
  for (const question of subQuestions) {
    const teamHasSolvedSpecificQuestion =
      await getTeamHasSolvedSpecificQuestion(
        questionGroup.id,
        user,
        question.seq
      );

    question.solved = teamHasSolvedSpecificQuestion;
  }

  const numQuestionsCompleted = subQuestions.filter((q) => q.solved).length;

  return {
    ...questionGroup,
    questions: subQuestions,
    numQuestionsSolvedQuestionGroup: numQuestionsCompleted,
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

const getCurrentPhase = async () => {
  const currentPhase = await prisma.liveConfig.findFirst({});

  if (!currentPhase) {
    throw new Error("No current phase");
  }

  return currentPhase;
};

export {
  getFinalQuestionGroupList,
  getQuestionGroupById,
  deleteQuestionGroup,
  getCurrentPhase,
};
