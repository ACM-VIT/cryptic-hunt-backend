import { prisma } from "../../prisma/prisma";
import { getFiles } from "../firebase/utils";
import { QuestionGroup, Question } from "../models/QuestionModels";

// Truncate the database
const truncate = async () => {
  await prisma.questionGroup.deleteMany({});
  await prisma.question.deleteMany({});
};

const uploadQuestionGroup = async (questionGroup: QuestionGroup) => {
  const { name, description, questions, numQuestions, isSequence } =
    questionGroup;

  const response = await prisma.questionGroup.create({
    data: {
      name: name,
      description: description,
      numQuestions: numQuestions,
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
