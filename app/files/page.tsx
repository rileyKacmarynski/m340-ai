import AuthButton from '@/components/AuthButton'
import FileUpload from '@/components/FileUpload'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Logo from '@/components/Logo'
import DocumentList from '@/app/files/document-list'

export default async function ProtectedPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: documents } = await supabase
    .from('documents')
    .select()
    .order('created_at', { ascending: false })
  if (!documents) return // pretty sure we'll always get an empty array here...

  return (
    <div className="grid h-dvh max-h-dvh w-full grid-rows-[auto,1fr] gap-10 overflow-hidden">
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

      <div className="animate-in mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-16 px-3 opacity-0">
        <section className="w-full max-w-sm space-y-3">
          <FileUpload />
        </section>
        <section className="space-y-3 ">
          <h2 className="text-3xl font-medium">My files</h2>
          <DocumentList documents={documents} />
        </section>
      </div>
    </div>
  )
}
