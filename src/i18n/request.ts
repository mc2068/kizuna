// next-intl WITHOUT locale routing: English only at launch. Every user-facing string lives in
// messages/en/<namespace>.json; French is added later as messages/fr/ without changing URLs.
import { getRequestConfig } from 'next-intl/server';
import { siteConfig } from '@/config/site';
import { NAMESPACES } from './namespaces';

export async function loadMessages(locale: string) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async () => {
  const locale = siteConfig.locale;
  return { locale, messages: await loadMessages(locale) };
});
