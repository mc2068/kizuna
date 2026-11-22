// STAND-IN for #3 (Mohamed owns src/i18n). next-intl without locale routing: English only,
// one JSON file per namespace in messages/en/. Add a namespace here when you add its file.
import { getRequestConfig } from 'next-intl/server';

export const NAMESPACES = ['common', 'marketing', 'forms', 'admin', 'privacy'] as const;

export default getRequestConfig(async () => {
  const locale = 'en';
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const),
  );
  return { locale, messages: Object.fromEntries(entries), timeZone: 'Africa/Tunis' };
});
