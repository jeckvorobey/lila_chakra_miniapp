/**
 * Единая палитра цветов рядов (чакр) для игрового поля и связанных UI-элементов.
 */

const DARK_CHAKRA_COLORS: Record<number, string> = {
  1: '#DC2626',
  2: '#F97316',
  3: '#EAB308',
  4: '#22C55E',
  5: '#06B6D4',
  6: '#6B46C1',
  7: '#9333EA',
  8: '#F5F5F4',
};

const LIGHT_CHAKRA_COLORS: Record<number, string> = {
  1: '#DC2626',
  2: '#F97316',
  3: '#EAB308',
  4: '#22C55E',
  5: '#06B6D4',
  6: '#6B46C1',
  7: '#9333EA',
  8: '#1C1917',
};

/**
 * Получить цвет ряда чакры с учётом темы.
 */
export function getChakraColor(chakraLevel: number, isDark: boolean): string {
  const palette = isDark ? DARK_CHAKRA_COLORS : LIGHT_CHAKRA_COLORS;
  return palette[chakraLevel] || '#A1A1AA';
}

/**
 * Получить цвет текста для круглого аватара клетки.
 */
export function getChakraAvatarTextColor(chakraLevel: number, isDark: boolean): 'white' | 'black' {
  if (chakraLevel === 8 && isDark) {
    return 'black';
  }

  return 'white';
}
