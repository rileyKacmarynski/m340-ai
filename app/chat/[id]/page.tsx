import DeployButton from '@/components/DeployButton'
import AuthButton from '@/components/AuthButton'
import { createClient } from '@/utils/supabase/server'
import FetchDataSteps from '@/components/tutorial/FetchDataSteps'
import Header from '@/components/Header'
import { redirect } from 'next/navigation'
import Chat from '@/app/chat/chat'
import Logo from '@/components/Logo'

const apiEndpoint = '/chat/api'

export default async function ProtectedPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: document } = await supabase
    .from('documents')
    .select()
    .eq('id', parseInt(params.id))
    .single()
  if (!document) {
    return redirect('/files')
  }

  return (
    <div className="flex max-h-dvh w-full flex-1 flex-col items-center gap-10 overflow-hidden">
      <div className="w-full">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 text-sm">
            <Logo />
            <div className="ml-auto">
              <AuthButton />
            </div>
          </div>
        </nav>
      </div>

      <div className="animate-in h-full w-full max-w-5xl px-3 opacity-0">
        <Chat api={apiEndpoint} document={document} />
      </div>
    </div>
  )
}
