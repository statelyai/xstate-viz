import { AddIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  HStack,
  IconProps,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import type { Monaco } from '@monaco-editor/react';
import { useActor, useMachine, useSelector } from '@xstate/react';
import React, { Suspense } from 'react';
import { ActorRefFrom, assign, createMachine, send, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { useAuth } from './authContext';
import { useSimulationMode } from './SimulationContext';
import { CommandPalette } from './CommandPalette';
import { ForkIcon, MagicIcon, SaveIcon } from './Icons';
import { notifMachine } from './notificationMachine';
import { parseMachines } from './parseMachine';
import {
  getEditorDefaultValue,
  getShouldImmediateUpdate,
  SourceMachineState,
} from './sourceMachine';
import type { AnyStateMachine } from './types';

const EditorWithXStateImports = React.lazy(
  () => import('./EditorWithXStateImports'),
);

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
            actions: editorPanelModel.assign({
              editorRef: (_, e) => e.editorRef,
            }),
          },
        ],
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

export type SourceOwnershipStatus =
  | 'user-owns-source'
  | 'no-source'
  | 'user-does-not-own-source';

const getSourceOwnershipStatus = (sourceState: SourceMachineState) => {
  let sourceStatus: SourceOwnershipStatus = 'no-source';

  if (!sourceState.matches('no_source')) {
    if (
      sourceState.context.loggedInUserId ===
      sourceState.context.sourceRegistryData?.owner?.id
    ) {
      sourceStatus = 'user-owns-source';
    } else {
      sourceStatus = 'user-does-not-own-source';
    }
  }

  return sourceStatus;
};

const getPersistTextAndIcon = (
  isSignedOut: boolean,
  sourceOwnershipStatus: SourceOwnershipStatus,
): { text: string; Icon: React.FC<IconProps> } => {
  if (isSignedOut) {
    switch (sourceOwnershipStatus) {
      case 'no-source':
        return { text: 'Login to save', Icon: SaveIcon };
      case 'user-does-not-own-source':
      case 'user-owns-source':
        return { text: 'Login to fork', Icon: ForkIcon };
    }
  }
  switch (sourceOwnershipStatus) {
    case 'no-source':
    case 'user-owns-source':
      return { text: 'Save', Icon: SaveIcon };
    case 'user-does-not-own-source':
      return { text: 'Fork', Icon: ForkIcon };
  }
};

export const EditorPanel: React.FC<{
  onSave: () => void;
  onFork: () => void;
  onCreateNew: () => void;
  onChange: (machine: AnyStateMachine[]) => void;
  onChangedCodeValue: (code: string) => void;
}> = ({ onSave, onChange, onChangedCodeValue, onFork, onCreateNew }) => {
  const authService = useAuth();
  const [authState] = useActor(authService);
  const sourceService = useSelector(
    authService,
    (state) => state.context.sourceRef!,
  );
  // TODO - consider refactoring this to useSelector
  const [sourceState] = useActor(sourceService);

  const sourceOwnershipStatus = getSourceOwnershipStatus(sourceState);

  const simulationMode = useSimulationMode();

  const persistMeta = getPersistTextAndIcon(
    authState.matches('signed_out'),
    sourceOwnershipStatus,
  );

  const immediateUpdate = getShouldImmediateUpdate(sourceState);
  const defaultValue = getEditorDefaultValue(sourceState);

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
      {simulationMode === 'visualizing' && (
        <CommandPalette
          onSave={() => {
            onSave();
          }}
          onVisualize={() => {
            send('COMPILE');
          }}
        />
      )}
      <Box height="100%" display="grid" gridTemplateRows="1fr auto">
        <Suspense fallback={null}>
          {simulationMode === 'visualizing' && (
            <>
              <EditorWithXStateImports
                sourceProvider={sourceState.context.sourceProvider}
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
                  onSave();
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
                    leftIcon={
                      <MagicIcon fill="gray.200" height="16px" width="16px" />
                    }
                    onClick={() => {
                      send({
                        type: 'COMPILE',
                      });
                    }}
                    variant="secondary"
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
                    isLoading={sourceState.hasTag('persisting')}
                    disabled={sourceState.hasTag('persisting')}
                    onClick={() => {
                      onSave();
                    }}
                    leftIcon={
                      <persistMeta.Icon
                        fill="gray.200"
                        height="16px"
                        width="16px"
                      />
                    }
                    variant="outline"
                  >
                    {persistMeta.text}
                  </Button>
                </Tooltip>
                {sourceOwnershipStatus === 'user-owns-source' && (
                  <Button
                    disabled={sourceState.hasTag('forking')}
                    isLoading={sourceState.hasTag('forking')}
                    onClick={() => {
                      onFork();
                    }}
                    leftIcon={
                      <ForkIcon fill="gray.200" height="16px" width="16px" />
                    }
                    variant="outline"
                  >
                    Fork
                  </Button>
                )}
                {sourceOwnershipStatus !== 'no-source' && (
                  <Button
                    leftIcon={<AddIcon fill="gray.200" />}
                    onClick={onCreateNew}
                    variant="outline"
                  >
                    New
                  </Button>
                )}
              </HStack>
            </>
          )}
        </Suspense>
        {simulationMode === 'inspecting' && (
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
