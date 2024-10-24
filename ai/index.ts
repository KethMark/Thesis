import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { ragMiddleware } from "./rag-middleware";
import { createOpenAI } from "@ai-sdk/openai";

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export const customModel = wrapLanguageModel({
  model: groq('llama-3.1-70b-versatile'),
  middleware: ragMiddleware,
});