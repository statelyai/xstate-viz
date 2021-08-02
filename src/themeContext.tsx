import { useMemo, useState } from 'react';
import { ThemeName } from './editor-themes';
import { localCache } from './localCache';
import { createRequiredContext } from './utils';

const [EditorThemeProviderLocal, useEditorTheme] = createRequiredContext<{
  theme: ThemeName;
  switchTheme(themeName: ThemeName): void;
}>('EditorTheme');

export function EditorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeName>(
    () => localCache.getEditorTheme() || 'xstateViz',
  );
  const contextValue = useMemo(
    () => ({ theme, switchTheme: setTheme }),
    [theme],
  );
  return (
    <EditorThemeProviderLocal value={contextValue}>
      {children}
    </EditorThemeProviderLocal>
  );
}
export { useEditorTheme };
