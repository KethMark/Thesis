"use client";

import React, { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronUp, FileIcon, LogOut, MoreVertical } from "lucide-react";
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EnterIcon, TrashIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface Docs {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Prof {
  id: string;
  userId: string;
  fullname: string | null;
  email: string | null;
}

interface userProps {
  docs: Docs[];
  prof: Prof[];
  AvatarProf: string | null;
}

interface GroupedDocuments {
  Today: Docs[];
  Yesterday: Docs[];
  "Previous 7 Days": Docs[];
  "Previous 30 Days": Docs[];
  Older: Docs[];
}

export const Sidebar = ({ docs, prof, AvatarProf }: userProps) => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const groupDocuments = (documents: Docs[]): GroupedDocuments => {
    const grouped: GroupedDocuments = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      "Previous 30 Days": [],
      Older: [],
    };

    documents.forEach((doc) => {
      const docDate = new Date(doc.createdAt);
      if (isToday(docDate)) {
        grouped.Today.push(doc);
      } else if (isYesterday(docDate)) {
        grouped.Yesterday.push(doc);
      } else if (isThisWeek(docDate)) {
        grouped["Previous 7 Days"].push(doc);
      } else if (isThisMonth(docDate)) {
        grouped["Previous 30 Days"].push(doc);
      } else {
        grouped.Older.push(doc);
      }
    });

    return grouped;
  };

  const groupedDocs = docs ? groupDocuments(docs) : ({} as GroupedDocuments);

  async function deleteDocument(id: string, fileUrl: string) {
    const toastId = toast.loading(`Processing....`)
    try {
      toast.loading(`Deleting your file ${id}`,  {
        id: toastId,
        position: 'top-right'
      })

      const res = await fetch('/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type':'application/json',
        },
        body: JSON.stringify({
          id,
          fileUrl
        })
      })

      const data = await res.json()

      if(data.error) {
        console.log(data.error)
      } else {
        docs.filter((doc: any) => doc.id !== id)
        toast.success('File deleted success', { 
          id: toastId, 
          position: 'top-right'
        })
        router.refresh()
      }

    } catch (error) {
      console.log("Error deleting document", error);
    }
  }

  const signOut = useMutation({
    mutationFn: async () => {
      await axios.delete('/api/signout').then((res) => res.data)
    },
    onSuccess: () => {
      toast.success('Signout success', { position: 'top-right'})
      router.refresh()
    },
    onError: () => {
      toast.error('Theirs something wrong logging out')
    }
  })

  const onSignout = () => {
    signOut.mutate()
  }

  return (
    <div className="w-full sm:w-64 bg-muted border-r flex flex-col h-screen">
      <div className="flex-grow flex flex-col overflow-hidden">
        <h2 className="p-4 text-lg font-semibold">HISTORY</h2>
        <ScrollArea className="flex-grow">
          {Object.entries(groupedDocs).map(
            ([groupName, files]) =>
              files.length > 0 && (
                <div key={groupName}>
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {groupName}
                  </div>
                  {files.map((file: Docs) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-accent transition-colors duration-200"
                    >
                      <button
                        className="flex items-center space-x-2 w-48"
                        onClick={() => {
                          toast.message(`Redirecting ${file.fileName}`, { position: "top-right"})
                          router.push(`/document/${file.id}`)
                        }}
                      >
                        <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 fill-white" />
                        <span className="text-sm text-foreground truncate">
                          {file.fileName}
                        </span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              toast.message(`Redirecting ${file.fileName}`, { position: "top-right"})
                              router.push(`/document/${file.id}`)
                            }}
                            className="gap-2"
                          >
                            <EnterIcon/>
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => deleteDocument(file.id, file.fileUrl)}
                          >
                            <TrashIcon/>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )
          )}
          {docs?.length == 0 && (
            <div className="text-center mt-64 text-muted-foreground">
              No recent file uploaded
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="mt-auto">
        <Separator className="my-2" />
        <Collapsible
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          className="px-4 py-2"
        >
          {prof.map((profile) => (
            <div key={profile.id}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={AvatarProf || undefined} alt={profile.fullname || 'User avatar'} />
                      <AvatarFallback className="bg-primary-foreground">
                        {profile?.fullname?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium w-32 truncate">{profile.email}</span>
                  </div>
                  <ChevronUp
                    className={`h-4 w-4 transition-transform ${
                      isProfileOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2 ">
                <div className="text-sm px-4">{profile.fullname}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onSignout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CollapsibleContent>
            </div>
          ))}
        </Collapsible>
      </div>
    </div>
  )
};
