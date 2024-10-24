import client from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { chatId } = await req.json()  

  if(!chatId) {
    return NextResponse.json({ error: 'chatId is missing' }, { status: 400 })
  }
  
  const conversation = await client.conversation.findFirst({
    where: {
      userId: chatId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      content: true,
    }
  })

  if (!conversation) {
    return NextResponse.json([])
  }

  return NextResponse.json(conversation.content)
}