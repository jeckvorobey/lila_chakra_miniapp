<template>
  <div>
    <p>{{ title }}</p>
    <ul>
      <li v-for="todo in todos" :key="todo.id" @click="increment">
        {{ todo.id }} - {{ todo.content }}
      </li>
    </ul>
    <p>Количество: {{ todoCount }} / {{ meta.totalCount }}</p>
    <p>Активно: {{ active ? 'да' : 'нет' }}</p>
    <p>Кликов по задачам: {{ clickCount }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Пример компонента.
 * Демонстрирует использование Composition API с TypeScript в Quasar.
 */
import { computed, ref } from 'vue';
import type { Todo, Meta } from 'src/types/common.interface';

interface Props {
  title: string;
  todos?: Todo[];
  meta: Meta;
  active: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  todos: () => [],
});

const clickCount = ref(0);
function increment() {
  clickCount.value += 1;
  return clickCount.value;
}

const todoCount = computed(() => props.todos.length);
</script>
