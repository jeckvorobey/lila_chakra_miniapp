import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)['en-US'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

/**
 * Detect user's preferred language
 */
function detectLocale(): MessageLanguages {
  // Check Telegram user language
  if (typeof window !== 'undefined') {
    const tg = (
      window as {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: { user?: { language_code?: string } };
          };
        };
      }
    ).Telegram?.WebApp;

    const telegramLang = tg?.initDataUnsafe?.user?.language_code;
    if (telegramLang?.startsWith('ru')) {
      return 'ru-RU';
    }
  }

  // Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language;
    if (browserLang?.startsWith('ru')) {
      return 'ru-RU';
    }
  }

  // Check saved preference
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('lila-language');
    if (saved === 'ru-RU' || saved === 'en-US') {
      return saved;
    }
  }

  // Default to Russian (primary audience)
  return 'ru-RU';
}

export default defineBoot(({ app }) => {
  const locale = detectLocale();

  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale,
    fallbackLocale: 'en-US',
    legacy: false,
    messages,
  });

  // Set i18n instance on app
  app.use(i18n);
});
