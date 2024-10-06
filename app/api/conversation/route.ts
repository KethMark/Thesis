import client from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request){
  const { chatId } = await req.json()  

  if(!chatId) {
    return NextResponse.json('chatId is missing')
  }
  
  const conversation = await client.conversation.findMany({
    where: {
      userId: chatId
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      role: true
    }
  })
  return NextResponse.json(conversation)
}