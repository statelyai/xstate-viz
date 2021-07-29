import { createContext, useCallback, useContext, useState } from 'react';
import { ThemeName } from './editor-themes';
import { localCache } from './localCache';

export const useTheme = () => {
  let startingTheme = localCache.getEditorTheme() || 'xstateViz';
  const [theme, setTheme] = useState<ThemeName>(startingTheme);
  return {
    theme,
    switchTheme: useCallback((themeName: ThemeName) => {
      setTheme(themeName);
    }, []),
  };
};

export const EditorThemeContext = createContext<{
  theme: ThemeName;
  switchTheme(themeName: ThemeName): void;
}>(null!);

export const useEditorTheme = () => {
  const ctx = useContext(EditorThemeContext);
  if (ctx === undefined) {
    throw Error('EditorTheme context must be used inside EditorThemeProvider');
  }

  return ctx;
};
