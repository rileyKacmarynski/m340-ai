'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { useChat } from 'ai/react'
import { FormEvent } from 'react'

export default function Chat({ api }: { api: string }) {
  const supabase = createClient()
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api,
  })

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    handleSubmit(e, {
      options: {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
        body: {
          value: 'world',
        },
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col">
      <ul className="grow">
        {messages.map((m, i) => (
          <li key={i}>
            {m.role === 'user' ? 'User: ' : 'AI: '}
            {m.role === 'user' ? m.content : m.ui}
          </li>
        ))}
      </ul>

      <form className="flex w-full items-center gap-2 p-2" onSubmit={submit}>
        <Input autoFocus value={input} onChange={handleInputChange} />
        <Button variant="secondary" type="submit">
          Send
        </Button>
      </form>
    </div>
  )
}
