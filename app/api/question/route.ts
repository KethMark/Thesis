import client from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { chatId } = await req.json()

  if(!chatId) {
    return NextResponse.json('chatId is missing')
  }

  const question = await client.question.findMany({
    where: {
      userId: chatId
    },
    select: {
      id: true,
      questions: true,
      createdAt: true
    }
  })
  console.log('Question response:', question)
  return NextResponse.json(question)
}