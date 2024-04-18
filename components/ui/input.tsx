'use client'

import * as React from 'react'

import cn from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [isUsingPointer, setIsUsingPointer] = React.useState(false)

    return (
      <input
        onPointerDown={() => setIsUsingPointer(true)}
        onBlur={() => setIsUsingPointer(false)}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-zinc-50/10 bg-zinc-50/5 px-3 py-2 text-sm shadow-sm ring-offset-background file:my-[-5px] file:h-8 file:rounded-md file:border-0 file:bg-white/5 file:px-2 file:text-sm file:font-medium file:text-zinc-50 placeholder:text-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&[type="file"]]:pl-1',
          !isUsingPointer &&
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    const [isUsingPointer, setIsUsingPointer] = React.useState(false)

    return (
      <textarea
        onPointerDown={() => setIsUsingPointer(true)}
        onBlur={() => setIsUsingPointer(false)}
        className={cn(
          'flex h-10 w-full rounded-md border border-zinc-50/10 bg-zinc-50/5 px-3 py-2 text-sm shadow-sm ring-offset-background file:my-[-5px] file:h-8 file:rounded-md file:border-0 file:bg-white/5 file:px-2 file:text-sm file:font-medium file:text-zinc-50 placeholder:text-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&[type="file"]]:pl-1',
          !isUsingPointer &&
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
          className
        )}
        ref={ref}
        rows={4}
        {...props}
      />
    )
  }
)
TextArea.displayName = 'Input'

export { Input, TextArea }
