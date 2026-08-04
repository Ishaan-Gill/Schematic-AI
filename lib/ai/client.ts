import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing GROQ_API_KEY environment variable. Please configure it before starting Schematic AI."
  );
}

export const groq = new Groq({
  apiKey,
});