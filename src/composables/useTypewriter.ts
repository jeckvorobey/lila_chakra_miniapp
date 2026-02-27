import { ref, onBeforeUnmount } from 'vue';

const TYPEWRITER_CHAR_INTERVAL_MS = 48;
const TYPEWRITER_CHARS_PER_TICK = 2;

export function useTypewriter() {
  const isTyping = ref(false);
  const typingAnswer = ref('');
  const pendingTypewriterText = ref('');
  let typewriterInterval: ReturnType<typeof setInterval> | null = null;

  function stopTypewriter(): void {
    if (typewriterInterval !== null) {
      clearInterval(typewriterInterval);
      typewriterInterval = null;
    }
    isTyping.value = false;
  }

  function startTypewriter(): void {
    if (typewriterInterval !== null) {
      return;
    }
    isTyping.value = true;
    typewriterInterval = setInterval(() => {
      if (!pendingTypewriterText.value.length) {
        stopTypewriter();
        return;
      }
      typingAnswer.value += pendingTypewriterText.value.slice(0, TYPEWRITER_CHARS_PER_TICK);
      pendingTypewriterText.value = pendingTypewriterText.value.slice(TYPEWRITER_CHARS_PER_TICK);
    }, TYPEWRITER_CHAR_INTERVAL_MS);
  }

  function enqueueTypewriterText(text: string): void {
    if (!text) {
      return;
    }
    pendingTypewriterText.value += text;
    if (typewriterInterval === null) {
      startTypewriter();
    }
  }

  async function waitTypewriterDrain(timeoutMs = 120000): Promise<void> {
    const startAt = Date.now();
    while (pendingTypewriterText.value.length && Date.now() - startAt < timeoutMs) {
      await new Promise((resolve) => {
        setTimeout(resolve, TYPEWRITER_CHAR_INTERVAL_MS);
      });
    }
    if (pendingTypewriterText.value.length) {
      typingAnswer.value += pendingTypewriterText.value;
      pendingTypewriterText.value = '';
    }
    stopTypewriter();
  }

  function resetTypewriter(): void {
    stopTypewriter();
    typingAnswer.value = '';
    pendingTypewriterText.value = '';
    isTyping.value = false;
  }

  onBeforeUnmount(() => {
    stopTypewriter();
  });

  return {
    isTyping,
    typingAnswer,
    enqueueTypewriterText,
    waitTypewriterDrain,
    resetTypewriter,
    stopTypewriter,
  };
}
