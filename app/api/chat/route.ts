import { createClient } from "@/utils/supabase/server-props";
import { ChatGroq } from "@langchain/groq";
import { NextRequest, NextResponse } from "next/server";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { SupabaseFilterRPCCall, SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  BytesOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import client from "@/lib/prisma";

const combineDocumentsFn = (docs: Document[]) => {
  const serializedSources = docs.map((doc) => doc.pageContent);
  return serializedSources.join("\n\n");
};

const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
  const formattedDialogueTurns = chatHistory.map((message) => {
    if (message.role === "user") {
      return `Human: ${message.content}`;
    } else if (message.role === "assistant") {
      return `Assistant: ${message.content}`;
    } else {
      return `${message.role}: ${message.content}`;
    }
  });
  return formattedDialogueTurns.join("\n");
};

const CONDENSE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

<chat_history>
  {chat_history}
</chat_history>

Follow Up Input: {question}
Standalone question:`;

const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE
);

const ANSWER_TEMPLATE = `
You are a PDF AI Assistant, trained to answer the questions about File in the context.

**I can help you with:**

* Summarizes and understand the file
* Answer, paraphrase and generate question
* Enhances and read the file
* Resolving conflicts
* Understanding context and workflows

**If your question is not related to Context, I won't be able to answer it.**

**Context:**

{context}

**Chat History:**

{chat_history}

**Question:**

{question}

**If the question is not related to context, Plss Dont answer answer it or provide any little information.**
`;

const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);

async function saveMessage(
  userId: string,
  content: string,
  speaker: 'user' | 'assistant'
) {
  const data = await client.conversation.create({
    data: {
      userId: userId,
      content: content,
      role: speaker
    }
  })

  if(!data) {
    console.error(!data)
    return NextResponse.json('Error saving conversation:', data)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;
    const chatId = body.chatId

    if(!chatId) {
      return NextResponse.json('chatId missing')
    }

    await saveMessage(chatId, currentMessageContent, 'user')

    const model = new ChatGroq({
      temperature: 0.9,
      modelName: "mixtral-8x7b-32768",
      apiKey: process.env.GROQ_API_KEY,
      verbose: true
    });

    const client = createClient();

    const vectorstore = new SupabaseVectorStore(
      new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY,
        batchSize: 48,
        model: "embed-english-v3.0",
      }),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);

    let resolveWithDocuments: (value: Document[]) => void;

    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });

    const funcFilter: SupabaseFilterRPCCall = (rpc) =>
      rpc.filter("metadata->>chat_id", "eq", chatId);

    const retriever = vectorstore.asRetriever({
      filter: funcFilter,
      callbacks: [
        {
          handleRetrieverEnd(document) {
            resolveWithDocuments(document);
          },
        },
      ],
    });

    const retrievalChain = retriever.pipe(combineDocumentsFn);

    const answerChain = RunnableSequence.from([
      {
        context: RunnableSequence.from([
          (input) => input.question,
          retrievalChain,
        ]),
        chat_history: (input) => input.chat_history,
        question: (input) => input.question,
      },
      answerPrompt,
      model,
    ]);

    const conversationalRetrievalQAChain = RunnableSequence.from([
      {
        question: standaloneQuestionChain,
        chat_history: (input) => input.chat_history,
      },
      answerChain,
      new BytesOutputParser(),
    ]);

    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent,
      chat_history: formatVercelMessages(previousMessages),
    });

    const documents = await documentPromise;

    const serializedSources = Buffer.from(
      JSON.stringify(
        documents.map((doc) => {
          return {
            pageContent: doc.pageContent.slice(0, 50) + "...",
            metadata: doc.metadata,
          };
        })
      )
    ).toString("base64");

    let aiResponse = ''
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const decoded = new TextDecoder().decode(chunk)
        aiResponse += decoded
        controller.enqueue(chunk)
      },
      flush() {
        saveMessage(chatId, aiResponse, 'assistant').catch(console.error)
      }
    })

    return new StreamingTextResponse(stream.pipeThrough(transformStream), {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
        "x-sources": serializedSources,
      },
    })

  } catch (error ) {
    console.error("Theirs something wrong:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}