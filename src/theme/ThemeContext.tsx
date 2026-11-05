import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, Palette } from './palettes';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'eventfomo_theme_mode';

type ThemeValue = {
  colors: Palette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

// Tells the phone which scheme to use, so native pieces (date picker, alerts, keyboard) match too.
const applyScheme = (mode: ThemeMode) =>
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Restore the saved choice when the app starts.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
          applyScheme(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    applyScheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const isDark = scheme === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, mode, setMode }),
    [isDark, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;

// Builds a screen's styles from the current palette. Pass a function that is defined outside the component.
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}