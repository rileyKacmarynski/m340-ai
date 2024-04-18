import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import cn from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-sky-950 border border-sky-900/90 text-primary-foreground hover:bg-sky-950/90',
        outline:
          'border border-zinc-700 bg-transparent hover:bg-zinc-800/50 hover:text-accent-foreground',
        secondary:
          'bg-zinc-800/50 border border-zinc-800 text-primary-foreground hover:bg-zinc-800',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary after:scale-x-0 font-medium relative after:absolute after:bottom-[8px] after:ease-out hover:after:scale-x-100 after:transition after:duration-100 after:delay-100 after:w-full after:h-[1.5px] after:bg-current',
      },
      size: {
        default: 'h-10 px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
