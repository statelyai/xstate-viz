import { ClassNames } from '@emotion/react';
import Editor, { OnMount } from '@monaco-editor/react';
import { KeyCode, KeyMod } from 'monaco-editor';
import { SpinnerWithText } from './SpinnerWithText';
import { format } from 'prettier/standalone';
import tsParser from 'prettier/parser-typescript';

function prettify(code: string) {
  return format(code, {
    parser: 'typescript',
    plugins: [tsParser],
  });
}

/**
 * CtrlCMD + S => format => update chart
 * Click on update chart button => update chart
 * Click on save/update => save/update to registry
 * CtrlCMD + B => save/update to registry
 */

interface EditorWithXStateImportsProps {
  onChange?: (text: string) => void;
  onMount?: OnMount;
  onPersist?: () => void;
  onFormat?: () => void;
  onError?: (err: any) => void;
  readonly?: boolean;
  defaultValue?: string;
}

export const EditorWithXStateImports = (
  props: EditorWithXStateImportsProps,
) => {
  return (
    <ClassNames>
      {({ css }) => (
        <Editor
          wrapperClassName={css`
            min-height: 0;
          `}
          defaultPath="main.ts"
          defaultLanguage="typescript"
          defaultValue={props.defaultValue}
          theme="vs-dark"
          options={{
            readOnly: props.readonly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'bounded',
            fontSize: 12,
            fixedOverflowWidgets: true,
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
            editor.addAction({
              id: 'format',
              label: 'Format',
              keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_S],
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
                    // props.onError?.('Formatting failed');
                  } finally {
                    props.onFormat?.();
                  }
                },
              },
            );

            // Ctrl/CMD + B to save/update to registry
            editor.addAction({
              id: 'backup',
              label: 'Backup',
              keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_B],
              run: () => {
                console.log('Backing up');
                props.onPersist?.();
              },
            });

            props.onMount?.(editor, monaco);
          }}
        />
      )}
    </ClassNames>
  );
};
