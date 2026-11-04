import { colors } from '../theme';

// Colour for a category tag. Unknown categories get the main purple.
export function categoryColor(category: string): string {
  return (colors.category as Record<string, string>)[category] ?? colors.primary;
}