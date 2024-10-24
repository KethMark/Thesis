"use client";

import {
  FileIcon,
  Loader,
  MoreVertical,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EnterIcon, TrashIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Docs {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
}

export function NavProjects() {
  const { isMobile } = useSidebar();

  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ["Document"],
    queryFn: async (): Promise<Docs[]> => {
      const res = await axios.get("/api/document");
      return res.data;
    },
  });

  async function deleteDocument(id: string, fileUrl: string) {
    const toastId = toast.loading(`Processing....`);
    try {
      toast.loading(`Processing your file..`, {
        id: toastId,
      });

      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          fileUrl,
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.log(data.error);
      } else {
        user?.filter((doc: Docs) => doc.id !== id);
        toast.success("File deleted success", {
          id: toastId,
        });
        router.refresh();
      }
    } catch (error) {
      console.log("Error deleting document", error);
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent Files</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading ? (
          <div className="flex justify-center mt-60">
            <Loader className="h-6 w-6 animate-spin"/>
          </div>
        ) : (
          <div>
            {user &&
              user.map((item) => (
                <SidebarMenuItem key={item.fileName}>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => router.push(`/document/${item.id}`)}
                    >
                      <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 fill-white" />
                      <span className="text-sm text-foreground">
                        {item.fileName}
                      </span>
                    </button>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-40 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem
                        onClick={() => router.push(`/document/${item.id}`)}
                        className="gap-2"
                      >
                        <EnterIcon />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => deleteDocument(item.id, item.fileUrl)}
                      >
                        <TrashIcon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
          </div>
        )}
        {/* <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
      </SidebarMenu>
    </SidebarGroup>
  );
}
