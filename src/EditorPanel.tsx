import { useMachine } from '@xstate/react';
import React from 'react';
import { ActorRefFrom } from 'xstate';
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
    notifRef: undefined as ActorRefFrom<typeof notifMachine>,
  },
  {
    events: {
      UPDATE_MACHINE_PRESSED: () => ({}),
      EDITOR_ENCOUNTERED_ERROR: (message: string) => ({ message }),
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
    EDITOR_ENCOUNTERED_ERROR: {
      actions: sendAction((_, e) => ({ type: 'ERROR', message: e.message }), {
        to: (ctx) => ctx.notifRef,
      }),
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
          send({
            type: 'EDITOR_ENCOUNTERED_ERROR',
            message: err.message,
          });
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
