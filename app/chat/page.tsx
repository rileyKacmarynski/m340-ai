import DeployButton from '@/components/DeployButton'
import AuthButton from '@/components/AuthButton'
import { createClient } from '@/utils/supabase/server'
import FetchDataSteps from '@/components/tutorial/FetchDataSteps'
import Header from '@/components/Header'
import { redirect } from 'next/navigation'
import Chat from '@/app/chat/chat'

const apiEndpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`

export default async function ProtectedPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="flex max-h-dvh w-full flex-1 flex-col items-center gap-10 overflow-hidden">
      <div className="w-full">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-4xl items-center justify-between p-3 text-sm">
            <div className="ml-auto">
              <AuthButton />
            </div>
          </div>
        </nav>
      </div>

      <div className="animate-in flex w-full max-w-4xl flex-1 flex-col px-3 opacity-0">
        <main className="flex flex-1 flex-col">
          <Chat api={apiEndpoint} />
        </main>
      </div>
    </div>
  )
}
