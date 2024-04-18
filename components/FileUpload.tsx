'use client'

import { ChangeEvent, useRef } from 'react'
import { Input } from './ui/input'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function FileUpload() {
  const supabase = createClient()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const { error } = await supabase.storage
      .from('files')
      .upload(`${crypto.randomUUID()}/${file.name}`, file)

    if (error) {
      // show a toast or something
      console.error(error)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    // lets show that new file
    router.refresh()
  }

  return (
    <>
      <label className="text-3xl font-medium" htmlFor="upload">
        Upload a file
      </label>
      <Input ref={inputRef} id="upload" name="upload" type="file" onChange={uploadFile} />
    </>
  )
}
