import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "..";
import { getFiles } from "../firebase/utils";
import bcrypt from "bcrypt";

const saltRounds = 10;

// Truncate the database
const truncate = async (tc?: Prisma.TransactionClient) => {
  const client = tc || prisma;
  await client.question.deleteMany({});
  await client.questionGroupSubmission.deleteMany({});
  await client.questionGroup.deleteMany({});
  // set all team's points' 0
  await client.team.updateMany({
    data: {
      points: 0,
    },
  });
};

export type UploadQuestionMethodType = Omit<
  Prisma.QuestionGroupCreateInput,
  "questions"
> & {
  questions: Prisma.QuestionCreateManyQuestionGroupInput[];
};

const uploadQuestionGroup = async (
  questionGroup: UploadQuestionMethodType,
  tc?: Prisma.TransactionClient
) => {
  const { name, description, isSequence, numberOfQuestions, questions } =
    questionGroup;

  const client = tc || prisma;

  // Hash each answer and store it in the database
  const hashedQuestions = await Promise.all(
    questions.map(async (question) => {
      const { answer, ...rest } = question;
      const hashedAnswer = await bcrypt.hash(answer, saltRounds);
      return {
        ...rest,
        answer: hashedAnswer,
      };
    })
  );

  const qg = await client.questionGroup.create({
    data: {
      name,
      description,
      isSequence,
      numberOfQuestions,
      questions: {
        createMany: {
          data: hashedQuestions,
        },
      },
    },
  });

  // for each team, create a question group submission for the created question group
  // with numQuestionsCompleted = 0
  const teams = await client.team.findMany();
  // use createMany
  const qGroupSubmissions: Prisma.QuestionGroupSubmissionCreateManyInput[] = [];
  for (const team of teams) {
    qGroupSubmissions.push({
      teamId: team.id,
      questionGroupId: qg.id,
      numQuestionsCompleted: 0,
    });
  }

  await client.questionGroupSubmission.createMany({
    data: qGroupSubmissions,
  });
};

const uploadQuestions = async (pc?: Prisma.TransactionClient) => {
  const client = pc || prisma;
  const questionGroups = await getFiles();

  const promises = questionGroups.map((questionGroup) => {
    return uploadQuestionGroup(questionGroup, client);
  });

  await Promise.all(promises);
};

const updateAllQuestions = async () => {
  return await prisma.$transaction(async (pc) => {
    await truncate(pc);
    await uploadQuestions(pc);
  });
};

const viewTeams = async () => {
  const teams = await prisma.team.findMany({
    include: {
      members: true,
      teamLeader: true,
      Submission: true,
    },
  });
  return teams;
};
const viewUsers = async () => {
  const users = await prisma.user.findMany({
    include: {
      team: true,
      teamLeading: true,
      Submission: true,
    },
  });
  return users;
};
export { updateAllQuestions, viewTeams, viewUsers, uploadQuestionGroup };
