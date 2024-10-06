import client from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server-props";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";
import { ChatGroq } from "@langchain/groq";
import { NextResponse } from "next/server";
import { MessageContent, MessageContentText } from "@langchain/core/messages";

export async function POST(req: Request) {
  const supabase = createClient();

  const { data: session } = await supabase.auth.getUser();

  const { fileUrl, fileName } = await req.json();

  const data = await client.user.create({
    data: {
      fileUrl,
      fileName,
      userId: session.user?.id!,
    },
  });

  if(!data) {
    console.log("Failed to retrieve:", !data)
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500})
  }

  const namespace = data.id;

  if(!namespace) {
    return NextResponse.json("Theirs no Id")
  }

  try {
    const response = await fetch(fileUrl);
    const buffer = await response.blob();
    const loader = new PDFLoader(buffer);
    const rawDocs = await loader.load();

    const text_splitter = RecursiveCharacterTextSplitter.fromLanguage(
      "markdown",
      {
        chunkSize: 200,
        chunkOverlap: 50,
      }
    );

    const splitDocuments = await text_splitter.splitDocuments(rawDocs);

    const documentsWithChatId = splitDocuments.map(doc => ({
      ...doc,
      metadata: { ...doc.metadata, chat_id: namespace }
    }))

    await SupabaseVectorStore.fromDocuments(
      documentsWithChatId,
      new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY,
        batchSize: 48,
        model: "embed-english-v3.0",
      }),
      {
        client: supabase,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    const model = new ChatGroq({
      temperature: 0.7,
      modelName: "mixtral-8x7b-32768",
      apiKey: process.env.GROQ_API_KEY,
    });

    const fullText = splitDocuments.map((doc) => doc.pageContent).join(" ");
    const prompt = `Based on the following text, generate only 4 relevant questions that a user might ask about the content:
  
      ${fullText.substring(0, 3000)}
  
      Output the questions as a JSON array of strings.`;

    const result = await model.call([{ role: "user", content: prompt }]);

    let questions: string[] = [];

    const extractTextContent = (content: MessageContent): string => {
      if (typeof content === "string") {
        return content;
      } else if (Array.isArray(content)) {
        return content
          .map((item) => {
            if (typeof item === "string") {
              return item;
            } else if ("text" in item) {
              return (item as MessageContentText).text;
            }
            return "";
          })
          .join("");
      }
      return "";
    };

    const contentString = extractTextContent(result.content);

    try {
      questions = JSON.parse(contentString);
    } catch (parseError) {
      console.error("Failed to parse questions:", parseError);
      questions = [contentString];
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Failed to generate valid questions");
    }

    await client.question.create({
      data: {
        userId: namespace,
        questions,
      },
    })

  } catch (error) {
    console.error("Ingest route error:", error);
    return NextResponse.json("Ingest route error");
  }

  return NextResponse.json({
    Message: "File Upload Success",
    id: namespace,
  });
}
