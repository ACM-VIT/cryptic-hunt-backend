import { QuestionGroup, Question, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma";
import { getFiles } from "../firebase/utils";
import bcrypt from "bcrypt";

const saltRounds = 10;

// Truncate the database
const truncate = async () => {
  await prisma.question.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.questionGroup.deleteMany({});
};

export type UploadQuestionMethodType = Omit<
  Prisma.QuestionGroupCreateInput,
  "questions"
> & {
  questions: Prisma.QuestionCreateManyQuestionGroupInput[];
};

const uploadQuestionGroup = async (questionGroup: UploadQuestionMethodType) => {
  const { name, description, isSequence, numberOfQuestions, questions } =
    questionGroup;

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

  const qg = await prisma.questionGroup.create({
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
  // with numQuestionsSolved = 0
  const teams = await prisma.team.findMany();
  const promises = [];
  for (const team of teams) {
    promises.push(
      prisma.questionGroupSubmission.create({
        data: {
          teamId: team.id,
          questionGroupId: qg.id,
          numQuestionsCompleted: 0,
        },
      })
    );
  }
  await Promise.all(promises);
};

const uploadQuestions = async () => {
  const questionGroups = await getFiles();

  for (const questionGroup of questionGroups) {
    uploadQuestionGroup(questionGroup);
  }
};

const updateAllQuestions = async () => {
  await truncate();
  await uploadQuestions();
};

export { updateAllQuestions, uploadQuestionGroup };
