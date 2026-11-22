// Public navigation, shared by the header (desktop and mobile) and the footer.
export type NavKey = 'howItWorks' | 'tool' | 'services' | 'caseStudy' | 'about' | 'sources' | 'twin';

export const MAIN_NAV: { key: NavKey; href: string }[] = [
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'tool', href: '/tool' },
  { key: 'services', href: '/services' },
  { key: 'caseStudy', href: '/case-study/djerba' },
  { key: 'about', href: '/about' },
  { key: 'twin', href: '/twin' },
];

/** True when `href` is the current page or a parent of it. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin pages use <AdminShell/> instead of the public header and footer. */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
