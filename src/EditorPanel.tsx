import Editor from '@monaco-editor/react';
import { useMachine } from '@xstate/react';
import React, { useEffect, useRef } from 'react';
import { assign, createMachine, StateMachine } from 'xstate';
import './EditorPanel.scss';

export const EditorPanel: React.FC<{
  onChange: (machine: StateMachine<any, any, any>) => void;
}> = ({ onChange }) => {
  const [state, send] = useMachine(() =>
    createMachine({
      context: {
        code: '',
      },
      on: {
        UPDATE: {
          actions: [
            assign({ code: (_, e) => e.code }),
            (ctx) => {
              console.log(ctx);
              onChange(ctx.code);
            },
          ],
        },
      },
    }),
  );

  const ref = useRef(null);

  return (
    <div data-panel="editor">
      <Editor
        height="auto"
        defaultLanguage="javascript"
        defaultValue="// some comment"
        theme="vs-dark"
        onMount={(editor) => (ref.current = editor)}
      />
      <div>
        <button
          onClick={() => {
            console.log(ref.current?.getValue());
            send({
              type: 'UPDATE',
              code: ref.current?.getValue(),
            });
          }}
        >
          Click me
        </button>
      </div>
    </div>
  );
};
