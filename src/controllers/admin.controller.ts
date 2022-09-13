import { PrismaClient } from "@prisma/client";
import { getFiles } from "../firebase/utils";

interface QuestionGroup {
  id?: string;
  name: string;
  description: string;
  questions: Question[];
  isMultiple: boolean;
  isSequence: boolean;
}

interface Question {
  seq: number;
  title: string;
  description: string;
  answer: string;
  pointsAwarded: number;
}

// Truncate the database
const truncate = async () => {
  const prisma = new PrismaClient();
  await prisma.questionGroup.deleteMany({});
  await prisma.question.deleteMany({});
};

const uploadQuestionGroup = async (questionGroup: QuestionGroup) => {
  const prisma = new PrismaClient();
  const { name, description, questions, isMultiple, isSequence } =
    questionGroup;

  const response = await prisma.questionGroup.create({
    data: {
      name: name,
      description: description,
      isMultiple: isMultiple,
      isSequence: isSequence,
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
