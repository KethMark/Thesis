"use client";
import Toggle from "@/components/ui/toggle";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import type {
  ToolbarSlot,
  TransformToolbarSlot,
} from "@react-pdf-viewer/toolbar";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { Message, useChat } from "ai/react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, FileText, HelpCircle, Loader, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Documents {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
}

interface documents {
  document: Documents;
  AvatarProf: string | null;
}

interface Question {
  id: string;
  userId: string;
  questions: string[];
  createdAt: string;
}

interface Source {
  metadata: {
    'loc.pageNumber'?: number;
    loc?: {
      pageNumber?: number;
    };
  };
}

export const DocumentClient = ({ document, AvatarProf }: documents) => {
  const chatId = document?.id;
  const pdfUrl = document?.fileUrl;

  const userProfilePic = AvatarProf ? AvatarProf : "/profile-icon.png";

  const toolbarPluginInstance = toolbarPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;

  const transform: TransformToolbarSlot = (slot: ToolbarSlot) => ({
    ...slot,
    Download: () => <></>,
    SwitchTheme: () => <></>,
    Open: () => <></>,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [sourcesForMessages, setSourcesForMessages] = useState<Record<string, Source[]>>({});

  const [chatOnlyView, setChatOnlyView] = useState(false);
  const router = useRouter();

  const { data: conversation } = useQuery<Message[]>({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/conversation", {
        chatId,
      });
      return response.data;
    },
  });

  const { data: question, isLoading: pendingQuestion } = useQuery<Question[]>({
    queryKey: ["conversation", chatId],
    queryFn: async () => {
      const response = await axios.post<Question[]>("/api/question", {
        chatId,
      });
      return response.data;
    },
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages: conversation || [],
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf-8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) => {
      console.error("Error occurred:", e);
      toast.error(e.message);
    },
    onFinish() {},
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        76
      )}px`;
    }
  }, [input]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const extractSourcePageNumber = (source: Source) => {
    return source.metadata["loc.pageNumber"] ?? source.metadata.loc?.pageNumber;
  };

  const onClickQuestion = (value: string) => {
    setInput(value);
    setTimeout(() => {
      formRef.current?.dispatchEvent(
        new Event("submit", {
          cancelable: true,
          bubbles: true,
        })
      );
    }, 1);
  };

  return (
    <div className="mx-auto flex flex-col no-scrollbar -mt-2">
      <Toggle chatOnlyView={chatOnlyView} setChatOnlyView={setChatOnlyView} />
      <div className="flex justify-between h-screen w-full lg:flex-row flex-col sm:space-y-20 lg:space-y-0 p-2">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js">
          <div
            className={`w-full h-[90vh] flex-col text-white !important ${
              chatOnlyView ? "hidden" : "flex"
            }`}
          >
            <div
              className="align-center bg-[#eeeeee] flex p-1"
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
            </div>
            <Viewer
              fileUrl={pdfUrl as string}
              plugins={[toolbarPluginInstance, pageNavigationPluginInstance]}
            />
          </div>
        </Worker>
        <div className="w-[90%] bg-gray-50 p-4 flex flex-col h-full">
          <Link
            href="/dashboard"
            className="self-start mb-4 flex items-center"
            onClick={() => router.refresh()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => {
              const sources = sourcesForMessages[index] || undefined;
              const isLastMessage = !isLoading && index === messages.length - 1;
              const previousMessages = index !== messages.length - 1;
              return (
                <div key={`chatMessage-${index}`}>
                  <div
                    className={`p-4 text-black animate ${
                      message.role === "assistant"
                        ? "bg-gray-100"
                        : isLoading && index === messages.length - 1
                        ? "bg-white"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex">
                      <Image
                        src={
                          message.role === "assistant"
                            ? "/profile-icon.png"
                            : userProfilePic
                        }
                        alt="profile image"
                        width={message.role === "assistant" ? 35 : 33}
                        height={30}
                        className="mr-4 rounded-md h-full"
                        priority
                      />
                      <ReactMarkdown className="prose">
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {(isLastMessage || previousMessages) && sources && (
                      <div className="flex space-x-4 ml-14 mt-3">
                        {sources
                          .filter((source: Source, index: number, self: Source[]) => {
                            const pageNumber = extractSourcePageNumber(source);
                            return (
                              self.findIndex(
                                (s: Source) =>
                                  extractSourcePageNumber(s) === pageNumber
                              ) === index
                            );
                          })
                          .map((source: Source, index: number) => (
                            <button
                              key={`source-${index}`}
                              className="flex items-center border-2 bg-gray-200 px-3 py-2 hover:bg-gray-100 transition rounded-lg"
                              onClick={() =>
                                pageNavigationPluginInstance.jumpToPage(
                                  Number(extractSourcePageNumber(source)) - 1
                                )
                              }
                            >
                              <FileText className="h-4 w-4" />. {extractSourcePageNumber(source)}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {pendingQuestion ? (
              <div className="flex items-center justify-center min-h-[500px]">
                <Loader className="h-15 w-15 animate-spin"/>
              </div>
            ) : (
              <div>
                {messages.length === 0 && (
                  <div className="w-full max-w-3xl mx-auto mt-80">
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-primary" />
                        Suggested Questions:
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question &&
                          question[0].questions.map((q, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full text-left justify-start h-auto py-3 px-4 hover:bg-primary/10 transition-colors"
                              onClick={() => onClickQuestion(q)}
                            >
                              <span className="line-clamp-2">{q}</span>
                            </Button>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleFormSubmit} className="relative" ref={formRef}>
            <Textarea
              ref={textareaRef}
              placeholder={isLoading ? "Thinking..." : "Ask about the PDF..."}
              value={input}
              disabled={isLoading}
              onChange={handleInputChange}
              autoFocus={false}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as React.KeyboardEvent<HTMLTextAreaElement>);
                }
              }}
              className="flex-1 pr-16 min-h-[24px] max-h-[72px] overflow-hidden"
              style={{ resize: "none" }}
            />
            <Button
              type="submit"
              className="absolute right-2 top-2"
              disabled={isLoading}
              variant="ghost"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
