import type { Monaco } from '@monaco-editor/react';

export const setMonacoTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme('xstate-viz', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#1a1f2c' },
  });
  monaco.editor.setTheme('xstate-viz');
};
