import { ClassNames } from '@emotion/react';
import Editor, { OnMount } from '@monaco-editor/react';
import { SpinnerWithText } from './SpinnerWithText';

interface EditorWithXStateImportsProps {
  onChange?: (text: string) => void;
  onMount?: OnMount;
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
            overflow: hidden;
          `}
          defaultPath="main.ts"
          defaultLanguage="typescript"
          defaultValue={props.defaultValue}
          theme="vs-dark"
          options={{
            readOnly: props.readonly,
            minimap: { enabled: false },
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

            props.onMount?.(editor, monaco);
          }}
        />
      )}
    </ClassNames>
  );
};
