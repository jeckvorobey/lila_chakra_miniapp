import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';

export type MessageLanguages = keyof typeof messages;
// Определить 'en-US' как базовую схему для ресурса
export type MessageSchema = (typeof messages)['en-US'];

// Смотрите https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // Определить схему сообщений локали
  export interface DefineLocaleMessage extends MessageSchema {}

  // Определить схему формата даты/времени
  export interface DefineDateTimeFormat {}

  // Определить схему формата чисел
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

/**
 * Определить предпочитаемый язык пользователя
 */
function detectLocale(): MessageLanguages {
  // Проверить язык пользователя Telegram
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

  // Проверить язык браузера
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language;
    if (browserLang?.startsWith('ru')) {
      return 'ru-RU';
    }
  }

  // Проверить сохранённые предпочтения
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('lila-language');
    if (saved === 'ru-RU' || saved === 'en-US') {
      return saved;
    }
  }

  // По умолчанию русский (основная аудитория)
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

  // Установить экземпляр i18n на приложение
  app.use(i18n);
});
