import { references, type Reference } from '@/content/method';

/** 1-based number of a reference, the same everywhere on the site. */
export function referenceNumber(id: string): number {
  const i = references.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`Unknown reference id "${id}". Add it to references in src/content/method.ts.`);
  return i + 1;
}

export function getReference(id: string): Reference {
  return references[referenceNumber(id) - 1];
}

export const referenceAnchor = (id: string) => `ref-${id}`;
export const referenceHref = (id: string) => `/sources#${referenceAnchor(id)}`;
