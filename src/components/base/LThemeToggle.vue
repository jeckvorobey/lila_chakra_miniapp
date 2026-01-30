<template>
  <q-btn
    flat
    round
    :icon="isDark ? 'dark_mode' : 'light_mode'"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    color="grey"
    @click="toggleTheme"
  >
    <q-tooltip>
      {{ isDark ? 'Light mode' : 'Dark mode' }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useTheme } from 'src/composables/useTheme';

const { isDark, toggleTheme } = useTheme();
</script>
