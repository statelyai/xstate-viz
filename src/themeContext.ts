import { createContext, useContext, useState } from 'react';
import { ThemeName } from './editor-themes';
import { localCache } from './localCache';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(
    () => localCache.getEditorTheme() || 'xstateViz',
  );
  return {
    theme,
    switchTheme: setTheme,
  };
};

export const EditorThemeContext = createContext<{
  theme: ThemeName;
  switchTheme(themeName: ThemeName): void;
}>(undefined!);

export const useEditorTheme = () => {
  const ctx = useContext(EditorThemeContext);
  if (ctx === undefined) {
    throw Error('EditorTheme context must be used inside EditorThemeProvider');
  }

  return ctx;
};
