// Test helper (Role 3): render components with the real English messages.
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import common from '../../messages/en/common.json';
import marketing from '../../messages/en/marketing.json';
import forms from '../../messages/en/forms.json';
import admin from '../../messages/en/admin.json';
import privacy from '../../messages/en/privacy.json';

export const messages = { common, marketing, forms, admin, privacy };

export function renderIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Africa/Tunis">
      {ui}
    </NextIntlClientProvider>,
  );
}
