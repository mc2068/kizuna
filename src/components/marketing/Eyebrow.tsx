import { cn } from '@/lib/utils';

type Tone = 'elec' | 'heat' | 'cool' | 'muted' | 'onDark';
const TONES: Record<Tone, string> = {
  elec: 'text-elec-text',
  heat: 'text-heat-text',
  cool: 'text-cool-text',
  muted: 'text-muted',
  onDark: 'text-elec',
};

/** Small coloured line above a heading. Uses the AA-safe text variants of the energy colours. */
export function Eyebrow({ children, tone = 'elec', className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <p className={cn('mb-3 text-[17px] font-semibold tracking-tight md:text-[21px]', TONES[tone], className)}>{children}</p>;
}
