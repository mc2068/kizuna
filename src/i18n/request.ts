// TEMPORARY (until #3/#4 merges): next-intl without locale routing, English only.
// Every namespace lives in messages/en/<namespace>.json and is loaded under its own key.
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "en";
  return {
    locale,
    messages: {
      common: (await import(`../../messages/${locale}/common.json`)).default,
      tool: (await import(`../../messages/${locale}/tool.json`)).default,
    },
  };
});
