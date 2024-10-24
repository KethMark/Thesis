import { createClient } from "@/utils/supabase/server-props";
import { createCohere } from "@ai-sdk/cohere";
import {
  embed,
  generateObject,
  generateText,
  type Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
} from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";

const selectionSchema = z.object({
  files: z.object({
    chatId: z.string(),
  }),
})

export const ragMiddleware: LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    const { prompt: messages, providerMetadata } = params;

    const supabase = createClient();

    const { success, data} = selectionSchema.safeParse(providerMetadata);

    if (!success) {
      return params;
    }

    const documentsId = data.files.chatId;

    const recentMessage = messages.pop();
    console.log('RecentMessage:', recentMessage)

    if (!recentMessage || recentMessage.role !== "user") {
      if (recentMessage) {
        messages.push(recentMessage);
      }

      return params;
    }

    const lastUserMessageContent = recentMessage.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n");

    console.log('LastUserMessageContent:', lastUserMessageContent)

    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    });

    const { object: classification } = await generateObject({
      model: groq('llama-3.1-70b-versatile'),
      output: "enum",
      enum: ["question", "statement", "other"],
      system: "classify the user message as a question, statement, or other",
      prompt: lastUserMessageContent,
    });

    if (classification !== "question") {
      console.log('Not equal to question')
      messages.push(recentMessage);
      return params;
    }

    const { text: hypotheticalAnswer } = await generateText({
      model: groq('llama-3.1-70b-versatile'),
      system: "Answer the users question:",
      prompt: lastUserMessageContent,
    });

    const cohere = createCohere({
      apiKey: process.env.COHERE_API_KEY,
    });

    const { embedding: hypotheticalAnswerEmbedding } = await embed({
      model: cohere.embedding("embed-english-v3.0"),
      value: hypotheticalAnswer,
    });

    const { data: relevantChunks, error } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: hypotheticalAnswerEmbedding,
        match_threshold: 0.10, 
        match_count: 10, 
        user_id_param: documentsId
      }
    ) 

    if (error) {
      console.error("Error retrieving relevant chunks:", error);
      messages.push(recentMessage);
      return params;
    }

    console.log('RelevantChunks:', relevantChunks)

    messages.push({
      role: "user",
      content: [
        ...recentMessage.content,
        {
          type: "text",
          text: "Here is some relevant information that you can use to answer the question:",
        },
        ...relevantChunks.map((chunk: any) => ({
          type: "text" as const,
          text: chunk.content,
          // metadata: chunk.metadata
        })),
      ],
    });

    return { ...params, prompt: messages };
  },
};