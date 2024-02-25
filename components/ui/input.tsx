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
          'flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-800/50 px-3 py-2 text-sm shadow-sm ring-offset-background file:border-0 file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50',
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

export { Input }
