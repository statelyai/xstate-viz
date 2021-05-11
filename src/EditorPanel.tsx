import Editor from '@monaco-editor/react';
import { useMachine } from '@xstate/react';
import React, { useEffect, useRef } from 'react';
import { assign, createMachine, StateMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import './EditorPanel.scss';
import { parseMachines } from './parseMachine';
import type { AnyStateMachine } from './types';

const editorPanelModel = createModel(
  {
    code: '',
  },
  {
    events: {
      UPDATE: (code: string) => ({ code }),
    },
  },
);

const editorPanelMachine = createMachine<typeof editorPanelModel>({
  context: editorPanelModel.initialContext,
  on: {
    UPDATE: {
      actions: [
        editorPanelModel.assign({ code: (_, e) => e.code }),
        'onChange',
      ],
    },
  },
});

export const EditorPanel: React.FC<{
  onChange: (machine: AnyStateMachine[]) => void;
}> = ({ onChange }) => {
  const [state, send] = useMachine(editorPanelMachine, {
    actions: {
      onChange: (ctx) => {
        const machines = parseMachines(ctx.code);
        onChange(machines);
      },
    },
  });

  const ref = useRef<any>(null);

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
