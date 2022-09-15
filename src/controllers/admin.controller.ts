import { prisma } from "../../prisma/prisma";
import { getFiles } from "../firebase/utils";
import { QuestionGroup, Question } from "../models/QuestionModels";
import bcrypt from "bcrypt";

const saltRounds = 10;

// Truncate the database
const truncate = async () => {
  await prisma.questionGroup.deleteMany({});
  await prisma.question.deleteMany({});
};

const uploadQuestionGroup = async (questionGroup: QuestionGroup) => {
  const { name, description, questions, numQuestions, isSequence } =
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

  const response = await prisma.questionGroup.create({
    data: {
      name: name,
      description: description,
      numQuestions: numQuestions,
      isSequence: isSequence,
      questions: {
        createMany: {
          data: hashedQuestions,
        },
      },
    },
  });
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

export { updateAllQuestions };
