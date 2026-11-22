import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

// Badges and pills. Verdict variants (good / maybe / weak) and lead status variants use the
// Contract 2 colours with their soft backgrounds; text colours pass WCAG AA on those backgrounds.
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap tabular [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-btn text-white',
        secondary: 'bg-tile text-ink',
        outline: 'border-line text-ink',
        good: 'bg-good-soft text-good-text',
        maybe: 'bg-maybe-soft text-maybe-text',
        weak: 'bg-weak-soft text-weak-text',
        new: 'bg-status-new-soft text-status-new',
        contacted: 'bg-status-contacted-soft text-status-contacted',
        quoted: 'bg-status-quoted-soft text-status-quoted',
        won: 'bg-status-won-soft text-status-won',
        lost: 'bg-status-lost-soft text-status-lost',
        soon: 'bg-maybe-soft text-maybe-text',
      },
      dot: { true: "before:size-1.5 before:rounded-full before:bg-current before:content-['']", false: '' },
    },
    defaultVariants: { variant: 'default', dot: false },
  },
);

function Badge({
  className,
  variant = 'default',
  dot = false,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant, dot }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
