import Editor, { OnMount } from '@monaco-editor/react';
import { SpinnerWithText } from './SpinnerWithText';

interface EditorWithXStateImportsProps {
  onChange?: (text: string) => void;
  onMount?: OnMount;
  isBusy?: boolean;
  defaultValue?: string;
}

export const EditorWithXStateImports = (
  props: EditorWithXStateImportsProps,
) => {
  return (
    <Editor
      height="auto"
      defaultPath="main.ts"
      defaultLanguage="typescript"
      defaultValue={props.defaultValue}
      theme="vs-dark"
      className="vscode-editor"
      options={{ readOnly: props.isBusy }}
      loading={<SpinnerWithText text="Preparing the editor" />}
      onChange={(text) => {
        if (text) {
          props.onChange?.(text);
        }
      }}
      onMount={async (editor, monaco) => {
        const indexFile = await fetch(`/xstate.d.ts.txt`).then((res) =>
          res.text(),
        );

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          `${indexFile}`,
        );

        props.onMount?.(editor, monaco);
      }}
    />
  );
};
