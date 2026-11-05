import { lightColors, Palette } from '../theme/palettes';

// Colour for a category tag. Unknown categories get the main purple.
// Pass the current palette so the colour follows light and dark mode.
export function categoryColor(category: string, palette: Palette = lightColors): string {
  return (palette.category as Record<string, string>)[category] ?? palette.primary;
}