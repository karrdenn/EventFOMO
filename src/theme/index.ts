import { lightColors } from './palettes';

// The light palette. Screens that are not converted yet keep using this.
export const colors = lightColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 };

export type { Palette } from './palettes';
export * from './ThemeContext';