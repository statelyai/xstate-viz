import { ClassNames } from '@emotion/react';
import Editor, { OnMount } from '@monaco-editor/react';
import { KeyCode, KeyMod } from 'monaco-editor';
import { SpinnerWithText } from './SpinnerWithText';
import { format } from 'prettier/standalone';
import tsParser from 'prettier/parser-typescript';
import { setMonacoTheme } from './setMonacoTheme';
import { SourceProvider } from './sourceMachine';
import { uniq } from './utils';

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
  return format(code, {
    parser: 'typescript',
    plugins: [tsParser],
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

export const EditorWithXStateImports = (
  props: EditorWithXStateImportsProps,
) => {
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
          theme="vs-dark"
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
          onMount={async (editor, monaco) => {
            monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
              customWorkerPath: `${new URL(
                process.env.PUBLIC_URL,
                window.location.origin,
              )}/ts-worker.js`,
            });
            setMonacoTheme(monaco);
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
              module: monaco.languages.typescript.ModuleKind.CommonJS,
              moduleResolution:
                monaco.languages.typescript.ModuleResolutionKind.NodeJs,
              strict: true,
            });

            const indexFile = await fetch(`/xstate.d.ts.txt`).then((res) =>
              res.text(),
            );

            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              indexFile,
              'file:///node_modules/xstate/index.d.ts',
            );

            // Prettier to format
            // Ctrl/CMD + Enter to visualize
            editor.addAction({
              id: 'format',
              label: 'Format',
              keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
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
              keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_S],
              run: () => {
                props.onSave?.();
                editor.getAction('editor.action.formatDocument').run();
              },
            });

            if (props.sourceProvider === 'gist') {
              const uri = monaco.Uri.parse('main.ts');
              const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
              const tsWorker = await getWorker(uri);
              const usedXStateGistIdentifiers: string[] = await (tsWorker as any).queryXStateGistIdentifiers(
                uri.toString(),
              );
              if (usedXStateGistIdentifiers.length > 0) {
                editor.executeEdits(uri.toString(), [
                  {
                    range: new monaco.Range(0, 0, 0, 0),
                    text: buildGistFixupImportsText(usedXStateGistIdentifiers),
                  },
                ]);
              }
            }

            props.onMount?.(editor, monaco);
          }}
        />
      )}
    </ClassNames>
  );
};

export default EditorWithXStateImports;
