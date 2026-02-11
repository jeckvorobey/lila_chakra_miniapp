/**
 * Точка инициализации Pinia для Quasar CLI.
 * Нужна, чтобы Quasar подключил store к приложению до выполнения boot-файлов.
 */

import { defineStore } from '#q-app/wrappers';
import { createPinia } from 'pinia';

export default defineStore(() => {
  const pinia = createPinia();
  return pinia;
});
