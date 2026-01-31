import { defineStore } from '#q-app/wrappers';
import { createPinia } from 'pinia';

/*
 * При добавлении новых свойств в хранилища,
 * вы должны также расширить интерфейс `PiniaCustomProperties`.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface PiniaCustomProperties {
    // Добавьте ваши пользовательские свойства здесь, если необходимо
  }
}

/*
 * Если вы не собираете с режимом SSR, вы можете
 * напрямую экспортировать создание Store;
 *
 * Функция ниже также может быть асинхронной; используйте
 * async/await или верните Promise, который разрешается
 * с экземпляром Store.
 */

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia();

  // Вы можете добавить плагины Pinia здесь
  // pinia.use(SomePiniaPlugin)

  return pinia;
});
