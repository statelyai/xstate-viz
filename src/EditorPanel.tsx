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
import {
  editor,
  Position,
  Range,
} from 'monaco-editor/esm/vs/editor/editor.api';
import React, { Suspense } from 'react';
import { ActorRefFrom, assign, createMachine, send, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { useAuth } from './authContext';
import { CommandPalette } from './CommandPalette';
import { ForkIcon, MagicIcon, SaveIcon } from './Icons';
import { notifMachine } from './notificationMachine';
import { parseMachines } from './parseMachine';
import { useSimulation } from './SimulationContext';
import {
  getEditorDefaultValue,
  getShouldImmediateUpdate,
  SourceMachineState,
} from './sourceMachine';
import type { AnyStateMachine, SimMode } from './types';

interface SyntaxErrorMetadata {
  position?: Position;
  length?: number; // number of chars the error spans from starting point
}
class SyntaxError extends Error {
  metadata: SyntaxErrorMetadata;
  constructor(message: string, metadata: SyntaxErrorMetadata) {
    super(message);
    // this.message = message;
    this.metadata = metadata;
  }

  get title() {
    return `SyntaxError at Line:${this.metadata.position?.lineNumber} Col:${this.metadata.position?.column}`;
  }

  toString() {
    return this.message;
  }
}

const EditorWithXStateImports = React.lazy(
  () => import('./EditorWithXStateImports'),
);

const editorPanelModel = createModel(
  {
    code: '',
    immediateUpdate: false,
    notifRef: undefined! as ActorRefFrom<typeof notifMachine>,
    monacoRef: null as Monaco | null,
    standaloneEditorRef: null as editor.IStandaloneCodeEditor | null,
    mainFile: 'main.ts',
    machines: null as AnyStateMachine[] | null,
  },
  {
    events: {
      COMPILE: () => ({}),
      EDITOR_READY: (
        monacoRef: Monaco,
        standaloneEditorRef: editor.IStandaloneCodeEditor,
      ) => ({ monacoRef, standaloneEditorRef }),
      UPDATE_MACHINE_PRESSED: () => ({}),
      EDITOR_ENCOUNTERED_ERROR: (message: string, title: string) => ({
        message,
        title,
      }),
      EDITOR_CHANGED_VALUE: (code: string) => ({ code }),
    },
  },
);

const editorPanelMachine = createMachine<typeof editorPanelModel>(
  {
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
                editorPanelModel.assign((_, e) => ({
                  monacoRef: e.monacoRef,
                  standaloneEditorRef: e.standaloneEditorRef,
                })),
              ],
              target: 'compiling',
            },
            {
              target: 'active',
              actions: editorPanelModel.assign({
                monacoRef: (_, e) => e.monacoRef,
                standaloneEditorRef: (_, e) => e.standaloneEditorRef,
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
          src: async (ctx) => {
            const monaco = ctx.monacoRef!;
            const uri = monaco.Uri.parse(ctx.mainFile);
            const tsWoker = await monaco.languages.typescript
              .getTypeScriptWorker()
              .then((worker) => worker(uri));

            const syntaxErrors = await tsWoker.getSyntacticDiagnostics(
              uri.toString(),
            );

            if (syntaxErrors.length > 0) {
              const model = ctx.monacoRef?.editor.getModel(uri);
              // Only report one error at a time
              const error = syntaxErrors[0];
              const errorPosition = model?.getPositionAt(error.start!);
              return Promise.reject(
                new SyntaxError(error.messageText.toString(), {
                  position: errorPosition,
                  length: error.length,
                }),
              );
            }

            const compiledSource = await tsWoker
              .getEmitOutput(uri.toString())
              .then((result) => result.outputFiles[0].text);

            return parseMachines(compiledSource);
          },
          onDone: {
            target: 'updating',
            actions: [
              assign({
                machines: (_, e: any) => e.data,
              }),
            ],
          },
          onError: [
            {
              cond: 'isSyntaxError',
              target: 'active',
              actions: ['highlightError', 'broadcastError'],
            },
            {
              target: 'active',
              actions: ['broadcastError'],
            },
          ],
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
          (_, e) => ({
            type: 'BROADCAST',
            status: 'error',
            message: e.message,
            title: e.title,
          }),
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
  },
  {
    guards: {
      isSyntaxError: (_, e: any) => e.data instanceof SyntaxError,
    },
    actions: {
      broadcastError: send((_, e: any) => ({
        type: 'EDITOR_ENCOUNTERED_ERROR',
        title: e.data.title,
        message: e.data.message,
      })),
      highlightError: (ctx, e) => {
        const {
          data: {
            metadata: { position, length = 0 },
          },
        } = e as any;
        const editor = ctx.standaloneEditorRef;
        if (position) {
          editor?.revealLineInCenterIfOutsideViewport(position.lineNumber);
          editor?.setSelection(
            new Range(
              position.lineNumber,
              0,
              position.lineNumber,
              position.column + length,
            ),
          );
        }
      },
    },
  },
);

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
  onCreateNew: () => void;
  onChange: (machine: AnyStateMachine[]) => void;
  onChangedCodeValue: (code: string) => void;
}> = ({ onSave, onChange, onChangedCodeValue, onCreateNew }) => {
  const authService = useAuth();
  const [authState] = useActor(authService);
  const sourceService = useSelector(
    authService,
    (state) => state.context.sourceRef!,
  );
  // TODO - consider refactoring this to useSelector
  const [sourceState] = useActor(sourceService);

  const sourceOwnershipStatus = getSourceOwnershipStatus(sourceState);

  const simService = useSimulation();
  const simMode: SimMode = useSelector(simService, (state) =>
    state.hasTag('inspecting') ? 'inspecting' : 'visualizing',
  );
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
      <CommandPalette
        onSave={() => {
          onSave();
        }}
        onVisualize={() => {
          send('COMPILE');
        }}
      />
      <Box height="100%" display="grid" gridTemplateRows="1fr auto">
        <Suspense fallback={null}>
          {simMode === 'visualizing' && (
            <>
              <EditorWithXStateImports
                sourceProvider={sourceState.context.sourceProvider}
                defaultValue={defaultValue}
                onMount={(standaloneEditor, monaco) => {
                  send({
                    type: 'EDITOR_READY',
                    monacoRef: monaco,
                    standaloneEditorRef: standaloneEditor,
                  });
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
                    title="Visualize"
                    leftIcon={
                      <MagicIcon fill="gray.200" height="16px" width="16px" />
                    }
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
                    isLoading={sourceState.hasTag('persisting')}
                    disabled={sourceState.hasTag('persisting') || isVisualizing}
                    title={persistMeta.text}
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
                  >
                    {persistMeta.text}
                  </Button>
                </Tooltip>
                {sourceOwnershipStatus === 'user-owns-source' && (
                  <Button
                    disabled={
                      sourceState.hasTag('forking') ||
                      current.matches('compiling')
                    }
                    isLoading={sourceState.hasTag('forking')}
                    onClick={() => {
                      onCreateNew();
                    }}
                    leftIcon={
                      <ForkIcon fill="gray.200" height="16px" width="16px" />
                    }
                  >
                    Fork
                  </Button>
                )}
              </HStack>
            </>
          )}
        </Suspense>
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
