import { convertToCoreMessages, streamText } from "ai";
import { customModel } from "@/ai";
import client from "@/lib/prisma";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();

  const result = await streamText({
    model: customModel,
    system:
      "You are a File AI Assistant! keep your responses concise and helpful.",
    messages: convertToCoreMessages(messages),
    experimental_providerMetadata: {
      files: {
        chatId: chatId,
      },
    },
    onFinish: async ({ text }) => {
      await client.conversation.create({
        data: {
          userId: chatId,
          content: [...messages, { role: "assistant", content: text }],
        }
      })
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  })

  return result.toDataStreamResponse();
}
