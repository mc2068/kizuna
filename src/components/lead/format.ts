// Small formatting helpers for the lead page (dates, file sizes, initials). Engine numbers are
// never formatted here: those go through @/lib/present.
import type { LeadStatus } from '@/lib/db/types';

// The team works in Tunisia: show every time in Tunis time, the same on server and client.
const TIME_ZONE = 'Africa/Tunis';

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

const dateOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE });

/** "17 Nov 2026, 12:30" in Tunis time. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** "17 Nov 2026" in Tunis time. */
export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

const oneDecimal = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });

/** "212 KB", "3.9 MB". Bytes use powers of 1,000, like file managers. */
export function formatBytes(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${oneDecimal.format(bytes / 1_000_000)} MB`;
}

/** "Mohamed Chakroun" -> "MC", "Hamza" -> "H". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/** Lead status colours (Contract 2): text and soft background. */
export const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-[#e8effd] text-[#2563eb]',
  contacted: 'bg-[#fbefd9] text-[#a35f00]',
  quoted: 'bg-[#ddf1ee] text-[#0f766e]',
  won: 'bg-[#e2f3e8] text-[#1d7f45]',
  lost: 'bg-[#ececea] text-[#6b6f72]',
};

/** The lowercase extension of a file name, '' when there is none. */
export function extension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}
