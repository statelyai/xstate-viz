import { createContext, useCallback, useContext, useState } from 'react';
import { ThemeName } from './editor-themes';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>('xstateViz');
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
