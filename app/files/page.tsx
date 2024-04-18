import AuthButton from '@/components/AuthButton'
import FileUpload from '@/components/FileUpload'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FileIcon } from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default async function ProtectedPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: documents } = await supabase.from('documents').select()
  if (!documents) return // pretty sure we'll always get an empty array here...

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

      <div className="animate-in flex w-full max-w-5xl flex-1 flex-col space-y-16 px-3 opacity-0">
        <section className="w-full max-w-sm space-y-3">
          <FileUpload />
        </section>
        <section className="space-y-3">
          <h2 className="text-3xl font-medium">My files</h2>
          <div className="-ml-3 flex">
            {documents!.map((d) => (
              <Link key={d.id} href={`/chat/${d.id}`}>
                <div className="inline-flex h-8 select-none items-center gap-1 rounded-lg px-3 transition hover:bg-indigo-300/10">
                  <FileIcon className="size-4 text-indigo-300" />
                  <h3>{trimFileExtension(d.name)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function trimFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex !== -1) {
    return filename.substring(0, lastDotIndex)
  }
  return filename
}
