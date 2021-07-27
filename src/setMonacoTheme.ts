export const setMonacoTheme = (
  monaco: typeof import('monaco-editor/esm/vs/editor/editor.api'),
) => {
  monaco.editor.defineTheme('xstate-viz', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#1a1f2c' },
  });
  monaco.editor.setTheme('xstate-viz');
};
