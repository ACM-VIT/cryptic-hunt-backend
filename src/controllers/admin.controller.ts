import { PrismaClient, QuestionGroup, Question, Prisma } from "@prisma/client";
import { getFiles } from "../firebase/utils";

// Truncate the database
const truncate = async () => {
  const prisma = new PrismaClient();
  await prisma.questionGroup.deleteMany({});
  await prisma.question.deleteMany({});
};

type UploadQuestionMethodType = Omit<
  Prisma.QuestionGroupCreateInput,
  "questions"
> & {
  questions: Prisma.QuestionCreateManyQuestionGroupInput[];
};

const uploadQuestionGroup = async (questionGroup: UploadQuestionMethodType) => {
  const prisma = new PrismaClient();
  const { name, description, isSequence, numberOfQuestions, questions } =
    questionGroup;

  const response = await prisma.questionGroup.create({
    data: {
      name,
      description,
      isSequence,
      numberOfQuestions,
      questions: {
        createMany: {
          data: questions,
        },
      },
    },
  });
};

const uploadQuestions = async () => {
  const prisma = new PrismaClient();
  const questionGroups = await getFiles();

  for (const questionGroup of questionGroups) {
    uploadQuestionGroup(questionGroup);
  }
};

const updateAllQuestions = async () => {
  await truncate();
  await uploadQuestions();
};

export { updateAllQuestions };
