import { ClassNames } from '@emotion/react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';
import { themes } from './editor-themes';
import { localCache } from './localCache';
import { SpinnerWithText } from './SpinnerWithText';
import { useEditorTheme } from './themeContext';
import { detectNewImportsToAcquireTypeFor } from './typeAcquisition';
import { SourceProvider } from './types';
import { uniq } from './utils';

/**
 * We're importing prettier via CDN - this declaration
 * allows us to use it globally
 */
declare global {
  export const prettier: typeof import('prettier');
  export const prettierPlugins: (string | import('prettier').Plugin)[];
}

function buildGistFixupImportsText(usedXStateGistIdentifiers: string[]) {
  const rootNames: string[] = [];
  let text = '';

  for (const identifier of usedXStateGistIdentifiers) {
    switch (identifier) {
      case 'raise':
        rootNames.push('actions');
        text += 'const { raise } = actions;\n';
        break;
      case 'XState':
        text += 'import * as XState from "xstate";\n';
        break;
      default:
        rootNames.push(identifier);
        break;
    }
  }

  if (rootNames.length) {
    // this uses `uniq` on the `rootNames` list because `actions` could be pushed into it while it was already in the list
    text = `import { ${uniq(rootNames).join(
      ', ',
    )} } from "xstate";\n${text.trimLeft()}\n`;
  }

  return text;
}

function prettify(code: string) {
  return prettier.format(code, {
    parser: 'typescript',
    plugins: prettierPlugins,
  });
}

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
  sourceProvider: SourceProvider | null;
  defaultValue?: string;
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
    <ClassNames>
      {({ css }) => (
        <Editor
          wrapperClassName={`${css`
            min-height: 0;
          `} js-monaco-editor`}
          defaultPath="main.ts"
          defaultLanguage="typescript"
          defaultValue={props.defaultValue}
          options={{
            minimap: { enabled: false },
            tabSize: 2,
          }}
          loading={<SpinnerWithText text="Preparing the editor" />}
          onChange={(text) => {
            if (text) {
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
                process.env.PUBLIC_URL,
                window.location.origin,
              )}/ts-worker.js`,
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
              keybindings: [
                // KeyMod.CtrlCmd
                2048 |
                  // KeyCode.Enter
                  3,
              ],
              run: (editor) => {
                editor.getAction('editor.action.formatDocument').run();
              },
            });

            monaco.languages.registerDocumentFormattingEditProvider(
              'typescript',
              {
                provideDocumentFormattingEdits: (model) => {
                  try {
                    return [
                      {
                        text: prettify(editor.getValue()),
                        range: model.getFullModelRange(),
                      },
                    ];
                  } catch (err) {
                    console.error(err);
                  } finally {
                    props.onFormat?.();
                  }
                },
              },
            );

            // Ctrl/CMD + S to save/update to registry
            editor.addAction({
              id: 'save',
              label: 'Save',
              keybindings: [
                // KeyMod.CtrlCmd
                2048 |
                  // KeyCode.KEY_S
                  49,
              ],
              run: () => {
                props.onSave?.();
                editor.getAction('editor.action.formatDocument').run();
              },
            });

            if (props.sourceProvider === 'gist') {
              const uri = monaco.Uri.parse('main.ts');
              const getWorker =
                await monaco.languages.typescript.getTypeScriptWorker();
              const tsWorker = await getWorker(uri);
              const usedXStateGistIdentifiers: string[] = await (
                tsWorker as any
              ).queryXStateGistIdentifiers(uri.toString());
              if (usedXStateGistIdentifiers.length > 0) {
                editor.executeEdits(uri.toString(), [
                  {
                    range: new monaco.Range(0, 0, 0, 0),
                    text: buildGistFixupImportsText(usedXStateGistIdentifiers),
                  },
                ]);
              }
            }

            props.onMount?.(withTypeAcquisition(editor, monaco), monaco);
          }}
        />
      )}
    </ClassNames>
  );
};

export default EditorWithXStateImports;
