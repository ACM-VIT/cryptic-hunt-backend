import { storage } from "./firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import axios from "axios";

// Get references to all files in the root directory
export const getFiles = async () => {
  const files = await listAll(ref(storage, "/"));
  const items = files.items;

  let fileList = [];

  for (const item of items) {
    const downloadUrl = await getDownloadURL(ref(storage, item.fullPath));
    const response = await axios.get(downloadUrl);
    let s = response.data;

    fileList.push(s);
  }

  return fileList;
};
