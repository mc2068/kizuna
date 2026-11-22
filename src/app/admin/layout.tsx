// Role 3: every /admin page sits inside <AdminShell/>. Only admins get here: the redirect below
// backs up the middleware check (#7, Mohamed). Admin pages depend on who is signed in, so they render
// per request, inside <Suspense> (cacheComponents).
import { Suspense } from 'react';
import { AdminGate } from '@/components/layout/AdminGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
