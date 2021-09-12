import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';
import { themes } from './editor-themes';
import { useEmbed } from './embedContext';
import { localCache } from './localCache';
import { prettierLoader } from './prettier';
import { SpinnerWithText } from './SpinnerWithText';
import { useEditorTheme } from './themeContext';
import { detectNewImportsToAcquireTypeFor } from './typeAcquisition';

/**
 * CtrlCMD + Enter => format => update chart
 * Click on update chart button => update chart
 * Click on save/update => save/update to registry
 * CtrlCMD + S => format => save/update to registry
 */

interface EditorWithXStateImportsProps {
  onChange?: (text: string) => void;
  onMount?: OnMount;
  onSave?: () => void;
  onFormat?: () => void;
  value: string;
}

// based on the logic here: https://github.com/microsoft/TypeScript-Website/blob/103f80e7490ad75c34917b11e3ebe7ab9e8fc418/packages/sandbox/src/index.ts
const withTypeAcquisition = (
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco,
): editor.IStandaloneCodeEditor => {
  const addLibraryToRuntime = (code: string, path: string) => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(code, path);
    const uri = monaco.Uri.file(path);
    if (monaco.editor.getModel(uri) === null) {
      monaco.editor.createModel(code, 'javascript', uri);
    }
  };

  const textUpdated = (code = editor.getModel()!.getValue()) => {
    detectNewImportsToAcquireTypeFor(
      code,
      addLibraryToRuntime,
      window.fetch.bind(window),
      {
        logger: {
          log: process.env.NODE_ENV !== 'production' ? console.log : () => {},
          error: console.error,
          warn: console.warn,
        },
      },
    );
  };

  // to enable type acquisition for any module we can introduce a deboouncer like here:
  // https://github.com/microsoft/TypeScript-Website/blob/97a97d460d64c3c363878f11db198d0027885d8d/packages/sandbox/src/index.ts#L204-L213

  textUpdated(
    // those are modules that we actually allow when we load the code at runtime
    // this "prefetches" the types for those modules so the autoimport feature can kick in asap for them
    ['xstate', 'xstate/lib/model', 'xstate/lib/actions']
      .map((specifier) => `import '${specifier}'`)
      .join('\n'),
  );

  return editor;
};

export const EditorWithXStateImports = (
  props: EditorWithXStateImportsProps,
) => {
  const embed = useEmbed();
  const editorTheme = useEditorTheme();
  const editorRef = useRef<typeof editor | null>(null);
  const definedEditorThemes = useRef(new Set<string>());

  useEffect(() => {
    const editor = editorRef.current;
    const definedThemes = definedEditorThemes.current;
    const theme = editorTheme.theme;

    if (!editor || !definedThemes) {
      return;
    }

    if (!definedThemes.has(theme)) {
      editor.defineTheme(theme, themes[theme]);
    }
    editor.setTheme(theme);
    localCache.saveEditorTheme(editorTheme.theme);
  }, [editorTheme.theme]);

  return (
    <Editor
      defaultPath="main.ts"
      defaultLanguage="typescript"
      value={props.value}
      options={{
        minimap: { enabled: false },
        tabSize: 2,
        glyphMargin: true,
        readOnly: embed?.isEmbedded && embed.readOnly,
      }}
      loading={<SpinnerWithText text="Preparing the editor" />}
      onChange={(text) => {
        if (typeof text === 'string') {
          props.onChange?.(text);
        }
      }}
      theme="vs-dark"
      onMount={async (editor, monaco) => {
        editorRef.current = monaco.editor;
        const theme = editorTheme.theme;
        monaco.editor.defineTheme(theme, themes[theme]);
        monaco.editor.setTheme(theme);

        monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
          customWorkerPath: `${new URL(
            window.location.origin,
          )}viz/ts-worker.js`,
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
          module: monaco.languages.typescript.ModuleKind.CommonJS,
          moduleResolution:
            monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          strict: true,
        });

        // Prettier to format
        // Ctrl/CMD + Enter to visualize
        editor.addAction({
          id: 'format',
          label: 'Format',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: (editor) => {
            editor.getAction('editor.action.formatDocument').run();
          },
        });

        monaco.languages.registerDocumentFormattingEditProvider('typescript', {
          provideDocumentFormattingEdits: async (model) => {
            try {
              return [
                {
                  text: await prettierLoader.format(editor.getValue()),
                  range: model.getFullModelRange(),
                },
              ];
            } catch (err) {
              console.error(err);
            } finally {
              props.onFormat?.();
            }
          },
        });

        // Ctrl/CMD + S to save/update to registry
        editor.addAction({
          id: 'save',
          label: 'Save',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
          run: () => {
            props.onSave?.();
            editor.getAction('editor.action.formatDocument').run();
          },
        });

        const wrappedEditor = withTypeAcquisition(editor, monaco);
        props.onMount?.(wrappedEditor, monaco);
      }}
    />
  );
};

export default EditorWithXStateImports;
