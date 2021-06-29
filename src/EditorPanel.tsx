import { Button, HStack } from '@chakra-ui/react';
import { useMachine, useSelector } from '@xstate/react';
import React from 'react';
import { ActorRefFrom } from 'xstate';
import { assign } from 'xstate';
import { createMachine, send as sendAction, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { useClient } from './clientContext';
import './EditorPanel.scss';
import { EditorWithXStateImports } from './EditorWithXStateImports';
import { notifMachine } from './notificationMachine';
import { parseMachines } from './parseMachine';
import type { AnyStateMachine } from './types';

const editorPanelModel = createModel(
  {
    code: '',
    notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
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
      actions: sendAction(
        (_, e) => ({ type: 'BROADCAST', status: 'error', message: e.message }),
        {
          to: (ctx) => ctx.notifRef,
        },
      ),
    },
    UPDATE_MACHINE_PRESSED: {
      actions: 'onChange',
    },
  },
});

const getPersistText = (isSignedOut: boolean, isUpdateMode: boolean) => {
  if (isSignedOut) {
    return 'Login to save';
  }
  return isUpdateMode ? 'Update' : 'Save';
};

export const EditorPanel: React.FC<{
  defaultValue: string;
  isUpdateMode: boolean;
  onSave: (code: string) => void;
  onChange: (machine: AnyStateMachine[]) => void;
}> = ({ defaultValue, isUpdateMode, onSave, onChange }) => {
  const clientService = useClient();
  const clientState = useSelector(clientService, (state) => state);
  const persistText = getPersistText(
    clientState.matches('signed_out'),
    isUpdateMode,
  );
  const [current, send] = useMachine(
    // TODO: had to shut up TS by extending model.initialContext
    editorPanelMachine.withContext({
      ...editorPanelModel.initialContext,
      code: defaultValue,
    }),
    {
      actions: {
        onChange: (ctx) => {
          // TODO: refactor to invoke
          try {
            const machines = parseMachines(ctx.code);
            onChange(machines);
          } catch (err: any) {
            console.error(err);
            send({
              type: 'EDITOR_ENCOUNTERED_ERROR',
              message: err.message,
            });
          }
        },
      },
    },
  );

  return (
    <div data-panel="editor">
      <EditorWithXStateImports
        defaultValue={defaultValue}
        onChange={(code) => {
          send({ type: 'EDITOR_CHANGED_VALUE', code });
        }}
      />
      <HStack>
        <Button
          onClick={() => {
            send({
              type: 'UPDATE_MACHINE_PRESSED',
            });
          }}
        >
          Update Chart
        </Button>
        <Button
          onClick={() => {
            onSave(current.context.code);
          }}
        >
          {persistText}
        </Button>
      </HStack>
    </div>
  );
};
