import { storage } from "./firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import axios from "axios";

export interface QuestionJson {
  seq: number;
  title: string;
  description: string;
  answer: string;
  pointsAwarded: number;
  costOfHint: null | number;
  hint: null | string;
  images: string[];
}

export interface QuestionGroupJson {
  name: string;
  description: string;
  questions: QuestionJson[];
  isSequence: boolean;
  phase: number;
}

// Get references to all files in the root directory
export const getFiles = async () => {
  const files = await listAll(
    ref(storage, `${process.env.FOLDER_NAME ?? ``}/`)
  );
  const items = files.items;

  const fileList: (QuestionGroupJson & { numberOfQuestions: number })[] = [];

  for (const item of items) {
    const downloadUrl = await getDownloadURL(ref(storage, item.fullPath));
    const response = await axios.get(downloadUrl);
    let s = response.data as QuestionGroupJson;

    fileList.push({ ...s, numberOfQuestions: s.questions.length });
  }

  return fileList;
};
