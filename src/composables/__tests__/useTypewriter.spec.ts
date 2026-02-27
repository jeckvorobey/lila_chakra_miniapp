import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useTypewriter } from '../useTypewriter';

function setupTypewriter() {
  let result: ReturnType<typeof useTypewriter> | null = null;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useTypewriter();
        return () => null;
      },
    }),
  );

  if (!result) {
    throw new Error('Не удалось инициализировать useTypewriter');
  }

  const typewriter = result as ReturnType<typeof useTypewriter>;

  return {
    isTyping: typewriter.isTyping,
    typingAnswer: typewriter.typingAnswer,
    enqueueTypewriterText: typewriter.enqueueTypewriterText,
    waitTypewriterDrain: typewriter.waitTypewriterDrain,
    resetTypewriter: typewriter.resetTypewriter,
    stopTypewriter: typewriter.stopTypewriter,
    unmount: () => wrapper.unmount(),
  };
}

describe('useTypewriter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('запускает печать чанков даже если isTyping уже true', () => {
    vi.useFakeTimers();
    const { isTyping, typingAnswer, enqueueTypewriterText, stopTypewriter, unmount } =
      setupTypewriter();

    // Эмулируем внешний код, который уже выставил флаг печати.
    isTyping.value = true;
    enqueueTypewriterText('Привет');

    vi.advanceTimersByTime(48);
    expect(typingAnswer.value.length).toBeGreaterThan(0);

    stopTypewriter();
    unmount();
  });
});
