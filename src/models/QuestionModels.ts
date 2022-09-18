interface QuestionGroup {
  id?: string;
  name: string;
  description: string;
  questions: Question[];
  numQuestions: number;
  isSequence: boolean;
}

interface Question {
  seq: number;
  title: string;
  description: string;
  answer: string;
  pointsAwarded: number;
}

export { QuestionGroup, Question };
