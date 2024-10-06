import { Sidebar } from '@/components/sidebar'
import client from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server-props'
import React from 'react'
import { ClientDashboard } from '../../components/dashboard-client'

const page = async () => {
  const supabase = createClient()

  const { data } = await supabase.auth.getUser()

  const docsList = await client.user.findMany({
    where: {
      userId: data.user?.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const profUser = await client.profile.findMany({
    where: {
      userId: data.user?.id
    }
  })

  const AvatarUrl = data.user?.user_metadata.avatar_url
 
  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-background">
      <Sidebar docs={docsList} prof={profUser} AvatarProf={AvatarUrl}/>
      <ClientDashboard/>
    </div>
  )
}

export default page