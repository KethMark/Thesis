import client from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server-props";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { NextResponse } from "next/server";
import { embedMany } from "ai";
import { createCohere } from '@ai-sdk/cohere';

export async function POST(req: Request) {
  const supabase = createClient();

  const { data: session } = await supabase.auth.getUser();

  const { fileUrl, fileName } = await req.json();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const data = await client.user.create({
    data: {
      fileUrl,
      fileName,
      userId: session.user.id,
    },
  });

  if(!data) {
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

    const text_splitter = new RecursiveCharacterTextSplitter(
      {
        chunkSize: 350,
        chunkOverlap: 50,
      }
    )

    const splitDocuments = await text_splitter.splitDocuments(rawDocs);

    const cohere = createCohere({
      apiKey: process.env.COHERE_API_KEY
    });

    const { embeddings } = await embedMany({
      model: cohere.embedding("embed-english-v3.0"),
      values: splitDocuments.map((chunk) => chunk.pageContent),
    });

    const documentsWithChatId = splitDocuments.map((doc, i) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      user_id: namespace,
      embedding: embeddings[i]
    }))

    const { error } = await supabase
      .from('documents')
      .insert(documentsWithChatId)

    if(error) {
      console.log("Error:", error)
      return NextResponse.json("Failed to insert the document")
    }

  } catch (error) {
    console.error("Ingest route error:", error);
    return NextResponse.json("Ingest route error");
  }

  return NextResponse.json({
    Message: "File Upload Success",
    id: namespace,
  });
}
