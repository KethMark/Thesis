import { DocumentClient } from '@/components/document-client'
import client from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server-props'

const page = async ({
  params
} : {
  params: { id: string }
}) => {
  const supabase = createClient()

  const { data } = await supabase.auth.getUser()

  const document = await client.user.findFirst({
    where: {
      id: params.id,
      userId: data.user?.id
    }
  })

  if (!document) {
    return <div>This document was not found</div>;
  }

  const AvatarUrl = data.user?.user_metadata.avatar_url

  return (
    <div>
      <DocumentClient document={document} AvatarProf={AvatarUrl}/>
    </div>
  )
}

export default page