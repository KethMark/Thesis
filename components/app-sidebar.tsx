"use client";

import * as React from "react";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({
  prof,
  AvatarProf
}: {
  prof: {
    id: string;
    userId: string;
    fullname: string | null;
    email: string | null;
}[],
  AvatarProf: string
}) {

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects />
      </SidebarContent>
      <SidebarFooter>
        <NavUser prof={prof} avatarProf={AvatarProf}/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}