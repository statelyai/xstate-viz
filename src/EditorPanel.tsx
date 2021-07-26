import { Button, HStack, Box, Text, Tooltip } from '@chakra-ui/react';
import { useActor, useMachine, useSelector } from '@xstate/react';
import React from 'react';
import { ActorRefFrom, createMachine, send, spawn, assign } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { useClient } from './clientContext';
import { EditorWithXStateImports } from './EditorWithXStateImports';
import { notifMachine } from './notificationMachine';
import { parseMachines } from './parseMachine';
import type { AnyStateMachine, SimMode } from './types';
import { Monaco } from '@monaco-editor/react';
import { CommandPalette } from './CommandPalette';
import { useSimulation } from './SimulationContext';

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
    booting: {
      on: {
        COMPILE: undefined,
      },
    },
    active: {},
    updating: {
      tags: ['visualizing'],
      entry: send('UPDATE_MACHINE_PRESSED'),
      always: 'active',
    },
    compiling: {
      tags: ['visualizing'],
      invoke: {
        src: (ctx) => {
          const uri = ctx.editorRef!.Uri.parse(ctx.mainFile);
          const compiledJSPromise = ctx
            .editorRef!.languages.typescript.getTypeScriptWorker()
            .then((worker) => worker(uri))
            .then((client) => client.getEmitOutput(uri.toString()))
            .then((result) => result.outputFiles[0].text) as Promise<string>;

          return compiledJSPromise.then((js) => {
            const machines = parseMachines(js);
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
      actions: [
        editorPanelModel.assign({ code: (_, e) => e.code }),
        'onChangedCodeValue',
      ],
    },
    EDITOR_ENCOUNTERED_ERROR: {
      actions: send(
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
  onChangedCodeValue: (code: string) => void;
}> = ({
  defaultValue,
  isUpdateMode,
  immediateUpdate,
  onSave,
  onChange,
  onChangedCodeValue,
}) => {
  const simService = useSimulation();
  const simMode: SimMode = useSelector(simService, (state) =>
    state.hasTag('inspecting') ? 'inspecting' : 'visualizing',
  );
  const clientService = useClient();
  const [clientState] = useActor(clientService);
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
        onChangedCodeValue: (ctx) => {
          onChangedCodeValue(ctx.code);
        },
      },
    },
  );
  const isVisualizing = current.hasTag('visualizing');

  return (
    <>
      <CommandPalette
        onSave={() => {
          onSave(current.context.code);
        }}
        onVisualize={() => {
          send('COMPILE');
        }}
      />
      <Box height="100%" display="grid" gridTemplateRows="1fr auto">
        {simMode === 'visualizing' && (
          <>
            <EditorWithXStateImports
              defaultValue={defaultValue}
              onMount={(_, monaco) => {
                send({ type: 'EDITOR_READY', editorRef: monaco });
              }}
              onChange={(code) => {
                send({ type: 'EDITOR_CHANGED_VALUE', code });
              }}
              onFormat={() => {
                send({
                  type: 'COMPILE',
                });
              }}
              onSave={() => {
                onSave(current.context.code);
              }}
            />
            <HStack padding="2">
              <Tooltip
                bg="black"
                color="white"
                label="Ctrl/CMD + Enter"
                closeDelay={500}
              >
                <Button
                  disabled={isVisualizing}
                  isLoading={isVisualizing}
                  loadingText="Visualize"
                  title="Visualize"
                  onClick={() => {
                    send({
                      type: 'COMPILE',
                    });
                  }}
                >
                  Visualize
                </Button>
              </Tooltip>
              <Tooltip
                bg="black"
                color="white"
                label="Ctrl/CMD + S"
                closeDelay={500}
              >
                <Button
                  isLoading={isPersistPending}
                  loadingText={persistText}
                  disabled={isPersistPending || isVisualizing}
                  title={persistText}
                  onClick={() => {
                    onSave(current.context.code);
                  }}
                >
                  {persistText}
                </Button>
              </Tooltip>
            </HStack>
          </>
        )}
        {simMode === 'inspecting' && (
          <Box padding="4">
            <Text as="strong">Inspection mode</Text>
            <Text>
              Services from a separate process are currently being inspected.
            </Text>
          </Box>
        )}
      </Box>
    </>
  );
};
