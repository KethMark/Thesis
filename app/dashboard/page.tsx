import { AppSidebar } from "@/components/app-sidebar"
import { ClientDashboard } from "@/components/dashboard-client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import client from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server-props"

export default async function Page() {

  const supabase = createClient()

  const { data } = await supabase.auth.getUser()


  const profUser = await client.profile.findMany({
    where: {
      userId: data.user?.id
    }
  })

  const AvatarUrl = data.user?.user_metadata.avatar_url

  return (
    <SidebarProvider>
      <AppSidebar prof={profUser} AvatarProf={AvatarUrl}/>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ClientDashboard/>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}