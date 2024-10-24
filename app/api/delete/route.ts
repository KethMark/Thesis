import client from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server-props"
import { NextResponse } from "next/server"

export async function DELETE(req: Request) {
  const { id, fileUrl } = await req.json()

  const supabase = createClient()

  // const { data } = await supabase.auth.getUser()

  // if(!data) {
  //   return NextResponse.json({error: 'No valid session'})
  // }

  // const vectorstore = new SupabaseVectorStore(
  //   new CohereEmbeddings({
  //     apiKey: process.env.COHERE_API_KEY,
  //     batchSize: 48,
  //     model: "embed-english-v3.0",
  //   }),
  //   {
  //     client: supabase,
  //     tableName: "documents",
  //     queryName: "match_documents",
  //   }
  // );

  try {
    // const document = await client.user.findFirst({
    //   where: {
    //     id,
    //     userId: data.user?.id
    //   }
    // })

    // if(!document) {
    //   return NextResponse.json({ error: 'Document not found'})
    // }

    const fullUrl = fileUrl
    const fileName = fullUrl.split('/').pop()
    console.log('filename', fileName)

    const { error } = await supabase
      .storage
      .from('pdf')
      .remove([fileName])

    if(error) {
      console.error(error)
      return NextResponse.json({ error: 'Pdf not found'})
    }

    // const { data: doc, error: failed } = await supabase
    //   .from('documents')
    //   .select("id")
    //   .eq("metadata->>chat_id", id);

    // if (failed) {
    //   console.error("Error querying documents:", failed);
    //   return NextResponse.json('Cant find the chat_Id')
    // }

    // const documents = doc.map(doc => doc.id);

    // await vectorstore.delete({ids: documents})

    await client.user.delete({
      where: {
        id
      }
    })

    return NextResponse.json({ text: 'Document deleted successfully', id})
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to delete your data'})
  }
}