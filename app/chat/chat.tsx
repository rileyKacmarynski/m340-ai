'use client'

import { Button } from '@/components/ui/button'
import { Input, TextArea } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database, Tables } from '@/supabase/types'
import { createClient } from '@/utils/supabase/client'
import { Message, useChat } from 'ai/react'
import { BotIcon, UserIcon } from 'lucide-react'
import { FormEvent, useEffect, useRef } from 'react'

export default function Chat({
  api,
  document,
}: {
  api: string
  document: Tables<'documents'>
}) {
  const supabase = createClient()
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api,
    initialMessages: [
      {
        id: '1',
        content: 'Hello, ask me anything about your document.',
        role: 'assistant',
      },
    ],
  })
  const scrollToBottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
          documentId: document.id,
        },
      },
    })
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <h1 className="ml-2 pb-3 text-2xl font-medium text-zinc-200">{document.name}</h1>
      <ScrollArea className="full grow">
        <div className="flex-1 space-y-2">
          <section className="flex flex-col gap-2 overflow-auto p-4">
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === 'user' ? (
                  <UserMessage message={m} />
                ) : (
                  <AiMessage message={m} />
                )}
              </div>
            ))}
            <div ref={scrollToBottomRef} />
          </section>
        </div>
      </ScrollArea>
      <form className="flex w-full items-end gap-4 p-4" onSubmit={submit}>
        <Input autoFocus value={input} onChange={handleInputChange} />
        <Button variant="default" type="submit">
          Send
        </Button>
      </form>
    </div>
  )
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex gap-4">
      <div className="grid-rows relative size-6 rounded-full bg-indigo-900 text-indigo-400">
        <UserIcon className="absolute inset-0 left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold text-zinc-300">You</div>
        <div>{message.content}</div>
      </div>
    </div>
  )
}

function AiMessage({ message }: { message: Message }) {
  return (
    <div className="flex gap-4">
      <div className="grid-rows relative size-6 rounded-full bg-zinc-700 text-zinc-400">
        <BotIcon className="absolute inset-0 left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold text-zinc-300">Assistant</div>
        <div>{message.content}</div>
      </div>
    </div>
  )
}
