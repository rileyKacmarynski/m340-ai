'use client'

import { Button } from '@/components/ui/button'
import { Tables } from '@/supabase/types'
import cn from '@/utils/cn'
import { createClient } from '@/utils/supabase/client'
import { FileIcon, Loader2Icon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MotionConfig, motion, AnimatePresence, Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'

type Document = Tables<'documents'>

export default function DocumentList({ documents }: { documents: Document[] }) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel('documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          console.log('realtime changes', payload)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  function isLoading(id: number) {
    return documents.find((d) => d.id === id)?.status !== 'finished'
  }

  const sortedDocs = [...documents]!.sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <>
      <div className="-ml-3 flex flex-wrap">
        <AnimatePresence initial={false} mode="popLayout">
          {sortedDocs.map((d) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', duration: 1, bounce: 0 }}
            >
              <Link key={d.id} href={isLoading(d.id) ? '' : `/chat/${d.id}`}>
                <div
                  className={cn(
                    'inline-flex h-8 select-none items-center gap-1 overflow-hidden rounded-lg px-3 transition duration-200 hover:bg-indigo-300/10',
                    isLoading(d.id) &&
                      'text-zinc-400 hover:cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  <AnimatedIcon loading={isLoading(d.id)} />
                  <h3>{trimFileExtension(d.name)}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

const animateProps: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
}

function AnimatedIcon({ loading }: { loading: boolean }) {
  return (
    <MotionConfig transition={{ duration: 0.2, type: 'spring' }}>
      <AnimatePresence initial={false} mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="inline-flex items-center gap-2 overflow-hidden"
            {...animateProps}
          >
            <Loader2Icon className="size-4 animate-spin text-zinc-400" />
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            className="inline-flex items-center gap-2 overflow-hidden"
            {...animateProps}
          >
            <FileIcon className="size-4 text-indigo-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

function trimFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex !== -1) {
    return filename.substring(0, lastDotIndex)
  }
  return filename
}
