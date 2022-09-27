import {
  LiveConfig,
  QuestionGroup,
  QuestionGroupSubmission,
  Submission,
  User,
  ViewedHint,
} from "@prisma/client";
import { prisma } from "..";
import cache from "../services/cache.service";
import logger from "../services/logger.service";

// Retrieve all question groups
export const getAllQuestionGroups = async () => {
  // check if cache has questionGroups
  const questionGroups = cache.get<QuestionGroup[]>("questionGroups");
  if (questionGroups) {
    return questionGroups;
  }

  // if not, retrieve from db
  const questionGroupsFromDb = await prisma.questionGroup.findMany();

  // set cache
  cache.set("questionGroups", questionGroupsFromDb);

  return questionGroupsFromDb;
};

// Check the number of questions solved in a given question group by a given user's team
const numQuestionsSolved = async (questionGroup: QuestionGroup, user: User) => {
  if (user.teamId === null) {
    return "User is not part of a team";
  }

  // check if cache has questionGroupSubmission
  const questionGroupSubmission = cache.get<QuestionGroupSubmission>(
    `questionGroupSubmission_${questionGroup.id}_${user.teamId}`
  );

  if (questionGroupSubmission) {
    return questionGroupSubmission.numQuestionsCompleted;
  }

  // if not, retrieve from db
  const questionGroupSubmissionFromDb =
    await prisma.questionGroupSubmission.findUnique({
      where: {
        teamId_questionGroupId: {
          teamId: user.teamId,
          questionGroupId: questionGroup.id,
        },
      },
    });

  if (!questionGroupSubmission || !questionGroupSubmissionFromDb) {
    return "Question group submission not found";
  }

  // set cache
  cache.set(
    `questionGroupSubmission_${questionGroup.id}_${user.teamId}`,
    questionGroupSubmissionFromDb
  );

  return questionGroupSubmissionFromDb.numQuestionsCompleted;
};

// get current phase score
const getCurrentPhaseScore = async () => {
  // check cache
  const currentPhaseScore = cache.get<number>("currentPhaseScore");

  if (currentPhaseScore) {
    return currentPhaseScore;
  }

  // if not, retrieve from db
  const currentPhaseScoreFromDb = await prisma.liveConfig.findFirst({
    select: {
      currentPhase: true,
    },
  });

  if (!currentPhaseScoreFromDb) {
    throw new Error("Current phase not found");
  }

  // set cache
  cache.set("currentPhaseScore", currentPhaseScoreFromDb.currentPhase);

  return currentPhaseScoreFromDb.currentPhase;
};

// Return a list of questionGroups that have an isSolved property with each object
const getFinalQuestionGroupList = async (user: User) => {
  const questionGroups = await getAllQuestionGroups();
  const finalQuestionGroupList = [];

  if (user.teamId === null) {
    return "User is not part of a team";
  }

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

  // filter according to phase score
  const filteredQuestionGroups = finalQuestionGroupList.filter(
    (questionGroup) => questionGroup.phase <= currentPhaseScore
  );

  // order by phase
  const orderedQuestionGroups = filteredQuestionGroups.sort(
    (a, b) => a.phase - b.phase
  );

  return orderedQuestionGroups;
};

// Check if user has viewed a question's hint
const getTeamHasViewedHint = async (
  questionGroupId: string,
  user: User,
  seq: number
) => {
  if (!user.teamId) {
    throw new Error("User is not part of a team");
  }

  // look for record in cache
  const viewedHint = cache.get<ViewedHint>(
    `viewedHint_${questionGroupId}_${user.teamId}_${seq}`
  );

  if (viewedHint) {
    return true;
  }

  // if not, retrieve from db
  const viewedHintFromDb = await prisma.viewedHint.findUnique({
    where: {
      teamId_questionGroupId_questionSeq: {
        teamId: user.teamId!,
        questionGroupId,
        questionSeq: seq,
      },
    },
  });

  if (viewedHintFromDb) {
    // set cache
    cache.set(
      `viewedHint_${questionGroupId}_${user.teamId}_${seq}`,
      viewedHintFromDb
    );
    return true;
  }

  return false;
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

  // check cache
  const questionGroupSubmission = cache.get<Submission[]>(
    `submission_${user.teamId}_${questionGroupId}_${seq}`
  );

  if (questionGroupSubmission) {
    return true;
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

  if (correctSubmissions.length > 0) {
    // set cache
    cache.set(
      `submission_${user.teamId}_${questionGroupId}_${seq}`,
      correctSubmissions
    );
    return true;
  }
};

// Get question group by id
const getQuestionGroupById = async (questionGroupId: string, user: User) => {
  // check cache
  let questionGroup = cache.get<
    | QuestionGroup & {
        questions: {
          hint: string | null;
          costOfHint: number | null;
          description: string;
          pointsAwarded: number;
          seq: number;
          title: string;
          images: string[];
        }[];
      }
  >(`questionGroup_${questionGroupId}`);

  if (questionGroup) {
    return questionGroup;
  }

  // if not, retrieve from db
  const questionGroupFromDb = await prisma.questionGroup.findUnique({
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

  // set cache
  if (questionGroupFromDb) {
    cache.set(`questionGroup_${questionGroupId}`, questionGroupFromDb);
    questionGroup = questionGroupFromDb;
  }

  // if question group not found, return error
  if (!questionGroup) {
    throw new Error("Question group not found");
  }

  let subQuestions: Question[] =
    questionGroup.questions.map((q: any) => ({ ...q, solved: false })) || [];

  // add solved property to each question
  for (let i = 0; i < subQuestions.length; i++) {
    const question = subQuestions[i];
    const hasSolved = await getTeamHasSolvedSpecificQuestion(
      questionGroup.id,
      user,
      question.seq
    );

    if (hasSolved) {
      subQuestions[i].solved = true;
    }
  }

  // numQuestionsSolvedQuestionGroup
  const numQuestionsSolvedQuestionGroup = subQuestions.filter(
    (q) => q.solved
  ).length;

  // add hint viewed property to each question
  for (const question of subQuestions) {
    if (question.hint) {
      const teamHasViewedHint = await getTeamHasViewedHint(
        questionGroup.id,
        user,
        question.seq
      );
      if (!teamHasViewedHint) {
        question.hint = null;
      }
    }
  }

  // if isSequence = true, return index <= numQuestionsSolvedQuestionGroup
  if (questionGroup.isSequence) {
    subQuestions = subQuestions.filter(
      (q, i) => i <= numQuestionsSolvedQuestionGroup
    );
  }

  return {
    ...questionGroup,
    questions: subQuestions,
    numQuestionsSolvedQuestionGroup,
  };
};

const deleteQuestionGroup = async (questionGroupId: string) => {
  try {
    await prisma.questionGroup.delete({
      where: {
        id: questionGroupId,
      },
    });
  } catch (error: any) {
    if (error?.code == "P2025") {
      throw new Error("Question group not found");
    }
  }
};

const getCurrentPhase = async () => {
  // check cache
  const currentPhase = cache.get<LiveConfig>(`currentPhase`);

  if (currentPhase) {
    return currentPhase;
  }

  // if not, retrieve from db
  const currentPhaseFromDb = await prisma.liveConfig.findFirst({});

  // set cache
  if (currentPhaseFromDb) {
    cache.set(`currentPhase`, currentPhaseFromDb);
    return currentPhaseFromDb;

    // if not found, return error
  } else {
    throw new Error("Current phase not found");
  }
};

export {
  getFinalQuestionGroupList,
  getQuestionGroupById,
  deleteQuestionGroup,
  getCurrentPhase,
};
