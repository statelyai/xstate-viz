import { useMemo, useState } from 'react';
import { ThemeName } from './editor-themes';
import { localCache } from './localCache';
import { createRequiredContext } from './utils';

interface EditorSettingsContext {
  theme: ThemeName;
  switchTheme(themeName: ThemeName): void;
  isTypescriptEnabled: boolean;
  setIsTypescriptEnabled: (value: boolean) => void;
}

const [EditorSettingsProviderLocal, useEditorSettings] =
  createRequiredContext<EditorSettingsContext>('EditorSettings');

export function EditorSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeName>(
    () => localCache.getEditorTheme() || 'xstateViz',
  );
  const [isTypescriptEnabled, setIsTypescriptEnabled] = useState<boolean>(() =>
    localCache.typescriptChecking.get(),
  );
  const contextValue: EditorSettingsContext = useMemo(
    () => ({
      theme,
      switchTheme: setTheme,
      isTypescriptEnabled,
      setIsTypescriptEnabled,
    }),
    [theme, isTypescriptEnabled],
  );
  return (
    <EditorSettingsProviderLocal value={contextValue}>
      {children}
    </EditorSettingsProviderLocal>
  );
}
export { useEditorSettings };
