import { Button, HStack } from '@chakra-ui/react';
import { useMachine, useSelector } from '@xstate/react';
import React from 'react';
import { ActorRefFrom, send } from 'xstate';
import { assign } from 'xstate';
import { createMachine, send as sendAction, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { useClient } from './clientContext';
import './EditorPanel.scss';
import { EditorWithXStateImports } from './EditorWithXStateImports';
import { notifMachine } from './notificationMachine';
import { parseMachines } from './parseMachine';
import type { AnyStateMachine } from './types';
import { Monaco } from '@monaco-editor/react';

function removeExportsImports(code: string) {
  return code.replace(/^(export default|export|import(.+)from(.+))/gm, '');
}

const editorPanelModel = createModel(
  {
    code: '',
    immediateUpdate: false,
    notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
    editorRef: null as Monaco | null,
    mainFile: 'main.ts',
    machines: null as AnyStateMachine[] | null,
  },
  {
    events: {
      COMPILE: () => ({}),
      EDITOR_READY: (editorRef: Monaco) => ({ editorRef }),
      UPDATE_MACHINE_PRESSED: () => ({}),
      EDITOR_ENCOUNTERED_ERROR: (message: string) => ({ message }),
      EDITOR_CHANGED_VALUE: (code: string) => ({ code }),
    },
  },
);

const editorPanelMachine = createMachine<typeof editorPanelModel>({
  context: editorPanelModel.initialContext,
  entry: [assign({ notifRef: () => spawn(notifMachine) })],
  initial: 'booting',
  states: {
    booting: {},
    active: {},
    updating: {
      entry: send('UPDATE_MACHINE_PRESSED'),
      always: 'active',
    },
    compiling: {
      invoke: {
        src: (ctx) => {
          const uri = ctx.editorRef!.Uri.parse(ctx.mainFile);
          const compiledJSPromise = ctx
            .editorRef!.languages.typescript.getTypeScriptWorker()
            .then((worker) => worker(uri))
            .then((client) => client.getEmitOutput(uri.toString()))
            .then((result) => result.outputFiles[0].text) as Promise<string>;

          return compiledJSPromise.then((js) => {
            const machines = parseMachines(removeExportsImports(js));
            return machines;
          });
        },
        onDone: {
          target: 'updating',
          actions: [
            assign({
              machines: (_, e: any) => e.data,
            }),
          ],
        },
        onError: {
          target: 'active',
          actions: [
            (_, e) => console.error(e.data),
            send((_, e) => ({
              type: 'EDITOR_ENCOUNTERED_ERROR',
              message: e.data.message,
            })),
          ],
        },
      },
    },
  },
  on: {
    EDITOR_READY: [
      {
        cond: (ctx) => ctx.immediateUpdate,
        actions: [
          editorPanelModel.assign({ editorRef: (_, e) => e.editorRef }),
        ],
        target: 'compiling',
      },
      {
        target: 'active',
        actions: editorPanelModel.assign({ editorRef: (_, e) => e.editorRef }),
      },
    ],
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
    COMPILE: 'compiling',
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
  immediateUpdate: boolean;
  onSave: (code: string) => void;
  onChange: (machine: AnyStateMachine[]) => void;
}> = ({ defaultValue, isUpdateMode, immediateUpdate, onSave, onChange }) => {
  const clientService = useClient();
  const clientState = useSelector(clientService, (state) => state);
  const persistText = getPersistText(
    clientState.matches('signed_out'),
    isUpdateMode,
  );
  const isPersistPending = clientState.hasTag('persisting');
  const [current, send] = useMachine(
    // TODO: had to shut up TS by extending model.initialContext
    editorPanelMachine.withContext({
      ...editorPanelModel.initialContext,
      immediateUpdate,
      code: defaultValue,
    }),
    {
      actions: {
        onChange: (ctx) => {
          onChange(ctx.machines!);
        },
      },
    },
  );

  return (
    <div data-panel="editor">
      <EditorWithXStateImports
        defaultValue={defaultValue}
        readonly={current.matches('compiling')}
        onMount={(_, monaco) => {
          send({ type: 'EDITOR_READY', editorRef: monaco });
        }}
        onChange={(code) => {
          send({ type: 'EDITOR_CHANGED_VALUE', code });
        }}
      />
      <HStack>
        <Button
          disabled={current.matches('compiling')}
          onClick={() => {
            send({
              type: 'COMPILE',
            });
          }}
        >
          Update Chart
        </Button>
        <Button
          isLoading={isPersistPending}
          loadingText={persistText}
          disabled={isPersistPending || current.matches('compiling')}
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
