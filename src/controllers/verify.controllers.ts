import path from "path";
import { parse } from "csv-parse";
import * as fs from "fs";
export interface Record {
  name: string;
  email: string;
  paid: number;
}
export async function readCsv() {
  const file = path.join(__dirname, "../../sample.csv");
  const data = fs.readFileSync(file, "utf8");
  const records: Record[] = await new Promise((resolve, reject) => {
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
