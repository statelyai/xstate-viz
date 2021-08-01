import { useMemo, useState } from 'react';
import { ThemeName, themes } from './editor-themes';
import { localCache } from './localCache';
import { createRequiredContext } from './utils';
import { editor } from 'monaco-editor';
import { useEffect } from 'react';

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

const definedEditorThemes = new Set();

export const useMonacoTheme = (
  {
    editorRef,
  }: {
    editorRef: typeof editor | null;
  } = { editorRef: null },
): { theme: ThemeName; switchTheme(theme: ThemeName): void } => {
  const editorTheme = useEditorTheme();

  useEffect(() => {
    const editor = editorRef;
    const definedThemes = definedEditorThemes;
    const theme = editorTheme.theme;

    if (!editor || !definedThemes) {
      return;
    }

    if (!definedThemes.has(theme)) {
      editor.defineTheme(theme, themes[theme]);
    }
    editor.setTheme(theme);
    localCache.saveEditorTheme(editorTheme.theme);
  }, [editorTheme.theme, editorRef]);

  return { theme: editorTheme.theme, switchTheme: editorTheme.switchTheme };
};
