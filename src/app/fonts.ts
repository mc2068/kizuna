// Role 3: Inter Tight for display, Inter for text, through next/font (self-hosted at build time).
import { Inter, Inter_Tight } from 'next/font/google';

export const fontText = Inter({ subsets: ['latin'], variable: '--font-text', display: 'swap' });
export const fontDisplay = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display-face',
  weight: ['500', '600', '700'],
  display: 'swap',
});

/** Put this on <html> in src/app/layout.tsx. */
export const fontClassName = `${fontText.variable} ${fontDisplay.variable}`;
