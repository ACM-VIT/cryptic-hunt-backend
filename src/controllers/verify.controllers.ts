import path from "path";
import { parse } from "csv-parse";
import * as fs from "fs";

export async function readCsv() {
  const file = path.join(__dirname, "../../sample.csv");
  const data = fs.readFileSync(file, "utf8");
  const records = await new Promise((resolve, reject) => {
    parse(data, { columns: true }, (err, records) => {
      if (err) {
        reject(err);
      } else {
        resolve(records);
      }
    });
  });
  return records;
}
export async function verifyUser(email: string) {
  try {
    const records: any = await readCsv();
    const user = records.find((record: any) => record.email === email);
    if (user) {
      return user.paid / 250 - 1;
    }
    return false;
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      throw Error(error.message);
    }
  }
}
