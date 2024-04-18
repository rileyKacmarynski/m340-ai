import { createClient } from '@/utils/supabase/server'
import { BookOpenIcon } from 'lucide-react'
import Link from 'next/link'

export default async function Logo() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <Link href={user ? '/files' : ''} className="flex -skew-x-12 items-center gap-1">
      <BookOpenIcon className="size-6 text-indigo-300" />
      <span className="text-lg font-medium tracking-wide text-indigo-100">RTFM</span>
    </Link>
  )
}
