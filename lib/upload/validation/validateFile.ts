import { DEBUG } from "../../config/debug";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

type ValidateFileArgs = {
  file: File;
};

export const validateFile = ({ file }: ValidateFileArgs): string | null => {
  if (!file.size) {
    return "Empty file.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  const extensions = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["csv", "xlsx"];

  if (!extensions || !allowedExtensions.includes(extensions)) {
    return "Unsupported file type. Only CSV and XLSX files are supported.";
  }

  const allowedMimeTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    if (DEBUG) {
      console.warn(`Unexpected MIME type "${file.type}" for file "${file.name}"`);
    }
  }

  return null;
};
