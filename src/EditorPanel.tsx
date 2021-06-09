import { useMachine } from '@xstate/react';
import React from 'react';
import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import './EditorPanel.scss';
import { EditorWithXStateImports } from './EditorWithXStateImports';
import { parseMachines } from './parseMachine';
import type { AnyStateMachine } from './types';

const editorPanelModel = createModel(
  {
    code: '',
  },
  {
    events: {
      UPDATE_MACHINE_PRESSED: () => ({}),
      EDITOR_CHANGED_VALUE: (code: string) => ({ code }),
    },
  },
);

const editorPanelMachine = createMachine<typeof editorPanelModel>({
  context: editorPanelModel.initialContext,
  on: {
    EDITOR_CHANGED_VALUE: {
      actions: [editorPanelModel.assign({ code: (_, e) => e.code })],
    },
    UPDATE_MACHINE_PRESSED: {
      actions: 'onChange',
    },
  },
});

export const EditorPanel: React.FC<{
  onChange: (machine: AnyStateMachine[]) => void;
}> = ({ onChange }) => {
  const [, send] = useMachine(editorPanelMachine, {
    actions: {
      onChange: (ctx) => {
        const machines = parseMachines(ctx.code);
        onChange(machines);
      },
    },
  });

  return (
    <div data-panel="editor">
      <EditorWithXStateImports
        defaultValue="// some comment"
        onChange={(code) => {
          send({ type: 'EDITOR_CHANGED_VALUE', code });
        }}
      />
      <div>
        <button
          onClick={() => {
            send({
              type: 'UPDATE_MACHINE_PRESSED',
            });
          }}
        >
          Update Chart
        </button>
      </div>
    </div>
  );
};
