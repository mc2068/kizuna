import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

// Keynote buttons: pills (radius 999px). "chevron" is the blue text link with a › that Apple uses.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/30 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'rounded-full bg-btn text-white hover:bg-[#0077ed]',
        dark: 'rounded-full bg-ink text-white hover:bg-black',
        secondary: 'rounded-full bg-tile text-ink hover:bg-[#ebebef]',
        outline: 'rounded-full border border-line bg-white text-ink hover:bg-tile',
        ghost: 'rounded-full text-ink hover:bg-tile',
        destructive: 'rounded-full bg-destructive text-white hover:bg-destructive/90',
        link: 'text-link underline-offset-4 hover:underline active:scale-100',
        chevron: 'text-link-chevron text-link underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        default: 'h-11 px-5 text-[17px]',
        sm: 'h-9 px-4 text-[15px]',
        xs: 'h-7 px-3 text-[13px]',
        lg: 'h-14 px-8 text-[19px]',
        icon: 'size-11 rounded-full',
        'icon-sm': 'size-9 rounded-full',
      },
    },
    compoundVariants: [
      { variant: ['link', 'chevron'], className: 'h-auto rounded-none px-0' },
    ],
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
