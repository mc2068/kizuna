// The 14 planned pages (docs/team/README.md) plus /twin, and their owners. Used by the stub pages and the e2e smoke test.
export type Route = {
  /** Path with sample values for dynamic segments. */
  path: string;
  /** Key in messages/en/common.json `pages`. */
  key: string;
  owner: 'Gaith' | 'Ahmed' | 'Mohamed';
  access: 'public' | 'signed-in' | 'admin';
};

export const ROUTES: Route[] = [
  { path: '/', key: 'home', owner: 'Gaith', access: 'public' },
  { path: '/how-it-works', key: 'howItWorks', owner: 'Gaith', access: 'public' },
  { path: '/tool', key: 'tool', owner: 'Ahmed', access: 'public' },
  { path: '/services', key: 'services', owner: 'Gaith', access: 'public' },
  { path: '/case-study/djerba', key: 'caseStudyDjerba', owner: 'Gaith', access: 'public' },
  { path: '/about', key: 'about', owner: 'Gaith', access: 'public' },
  { path: '/sources', key: 'sources', owner: 'Gaith', access: 'public' },
  { path: '/request-study', key: 'requestStudy', owner: 'Gaith', access: 'public' },
  { path: '/privacy', key: 'privacy', owner: 'Gaith', access: 'public' },
  { path: '/projects', key: 'projects', owner: 'Ahmed', access: 'signed-in' },
  { path: '/p/demo-djerba', key: 'sharedProject', owner: 'Ahmed', access: 'public' },
  { path: '/sign-in', key: 'signIn', owner: 'Mohamed', access: 'public' },
  { path: '/twin', key: 'twin', owner: 'Mohamed', access: 'public' },
  { path: '/admin', key: 'admin', owner: 'Gaith', access: 'admin' },
  { path: '/admin/leads/L-1047', key: 'adminLead', owner: 'Ahmed', access: 'admin' },
];
