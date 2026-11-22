// One JSON file per namespace in messages/en/. Add a namespace here and create its file.
export const NAMESPACES = [
  'common',
  'marketing',
  'tool',
  'projects',
  'admin',
  'lead',
  'auth',
  'forms',
  'engine',
  'method',
] as const;

export type Namespace = (typeof NAMESPACES)[number];
