import { useMachine } from '@xstate/react';
import React from 'react';
import { assign } from 'xstate';
import { createMachine, send as sendAction, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import './EditorPanel.scss';
import { EditorWithXStateImports } from './EditorWithXStateImports';
import { notifMachine } from './notificationMachine';
import { parseMachines } from './parseMachine';
import type { AnyStateMachine } from './types';

const editorPanelModel = createModel(
  {
    code: '',
    notifRef: undefined as any,
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
  entry: assign({ notifRef: () => spawn(notifMachine) }),
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
        try {
          const machines = parseMachines(ctx.code);
          onChange(machines);
        } catch (err) {
          console.log(err);
          console.log(ctx);
          ctx.notifRef.send({ type: 'ERROR', message: err.toString() });
          // send({ type: 'ERROR', message: err.toString() } as any, {
          //   to: (ctx: any) => ctx.notifRef,
          // });
        }
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
