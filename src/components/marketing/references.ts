import { REFERENCES } from '@/content/method';
import { MARKETING_REFERENCES } from './content';

export type SiteReference = { id: string; title: string; publisher: string; url: string; accessed: string };

/** Method references first (Hamza's method.ts), then the marketing ones. Numbered in this order. */
export const ALL_REFERENCES: SiteReference[] = [...REFERENCES, ...MARKETING_REFERENCES];

/** 1-based number of a reference, the same everywhere on the site. */
export function referenceNumber(id: string): number {
  const i = ALL_REFERENCES.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`Unknown reference id "${id}". Add it to REFERENCES or MARKETING_REFERENCES.`);
  return i + 1;
}

export function getReference(id: string): SiteReference {
  return ALL_REFERENCES[referenceNumber(id) - 1];
}

export const referenceAnchor = (id: string) => `ref-${id}`;
export const referenceHref = (id: string) => `/sources#${referenceAnchor(id)}`;
