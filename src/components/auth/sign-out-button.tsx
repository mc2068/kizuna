// A sign-out form button. Drop it into any header or menu (Role 3's SiteHeader, AdminShell).
import { getTranslations } from 'next-intl/server';
import { signOut } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

export async function SignOutButton({ className }: { className?: string }) {
  const t = await getTranslations('auth');
  return (
    <form action={signOut}>
      <button type="submit" className={cn('text-sm font-medium text-neutral-600 underline-offset-4 hover:underline', className)}>
        {t('signOut')}
      </button>
    </form>
  );
}
