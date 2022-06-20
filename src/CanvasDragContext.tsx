import { InterpreterFrom } from 'xstate';
import { useInterpret } from '@xstate/react';
import { useRef } from 'react';
import { createInterpreterContext } from './utils';
import { createModel } from 'xstate/lib/model';
import { useCanvas } from './CanvasContext';
import { canvasModel, ZoomFactor } from './canvasMachine';
import {
  dragSessionModel,
  dragSessionTracker,
  DragSession,
  PointDelta,
} from './dragSessionTracker';
import { useMachine, useSelector } from '@xstate/react';
import { actions } from 'xstate';
import { Point } from './pathUtils';
import {
  isAcceptingArrowKey,
  isAcceptingSpaceNatively,
  isTextInputLikeElement,
  isWithPlatformMetaKey,
} from './utils';

const dragModel = createModel(
  {
    ref: null as unknown as React.RefObject<HTMLDivElement>,
  },
  {
    events: {
      LOCK: () => ({}),
      RELEASE: () => ({}),
      ENABLE_PANNING: (sessionSeed: DragSession | null = null) => ({
        sessionSeed,
      }),
      DISABLE_PANNING: () => ({}),
      ENABLE_PAN_MODE: () => ({}),
      DISABLE_PAN_MODE: () => ({}),
      DRAG_SESSION_STARTED: ({ point }: { point: Point }) => ({
        point,
      }),
      DRAG_SESSION_STOPPED: () => ({}),
      POINTER_MOVED_BY: ({ delta }: { delta: PointDelta }) => ({
        delta,
      }),
      WHEEL_PRESSED: (data: DragSession) => ({ data }),
      WHEEL_RELEASED: () => ({}),
    },
  },
);

const dragMachine = dragModel.createMachine(
  {
    preserveActionOrder: true,
    initial: 'checking_if_disabled',
    states: {
      checking_if_disabled: {
        always: [
          {
            target: 'permanently_disabled',
            cond: 'isPanDisabled',
          },
          'enabled',
        ],
      },
      permanently_disabled: {},
      enabled: {
        type: 'parallel',
        states: {
          mode: {
            initial: 'lockable',
            states: {
              lockable: {
                initial: 'released',
                states: {
                  released: {
                    invoke: [
                      {
                        src: 'invokeDetectLock',
                      },
                      {
                        src: 'wheelPressListener',
                      },
                    ],
                    on: {
                      LOCK: 'locked',
                      WHEEL_PRESSED: 'wheelPressed',
                    },
                  },
                  locked: {
                    entry: actions.raise(dragModel.events.ENABLE_PANNING()),
                    exit: actions.raise(dragModel.events.DISABLE_PANNING()),
                    on: { RELEASE: 'released' },
                    invoke: {
                      src: 'invokeDetectRelease',
                    },
                  },
                  wheelPressed: {
                    entry: actions.raise(((_ctx: any, ev: any) =>
                      dragModel.events.ENABLE_PANNING(ev.data)) as any),
                    exit: actions.raise(dragModel.events.DISABLE_PANNING()),
                    on: {
                      DRAG_SESSION_STOPPED: 'released',
                    },
                  },
                },
                on: {
                  ENABLE_PAN_MODE: 'pan',
                },
              },
              pan: {
                tags: ['panMode'],
                entry: actions.raise(dragModel.events.ENABLE_PANNING()),
                exit: actions.raise(dragModel.events.DISABLE_PANNING()),
                on: {
                  DISABLE_PAN_MODE: 'lockable',
                },
              },
            },
          },
          panning: {
            initial: 'disabled',
            states: {
              disabled: {
                on: {
                  ENABLE_PANNING: 'enabled',
                },
              },
              enabled: {
                entry: 'disableTextSelection',
                exit: 'enableTextSelection',
                invoke: {
                  id: 'dragSessionTracker',
                  src: (ctx, ev) =>
                    dragSessionTracker.withContext({
                      ...dragSessionModel.initialContext,
                      ref: ctx.ref,
                      session:
                        // this is just defensive programming
                        // this really should receive ENABLE_PANNING at all times as this is the event that is making this state to be entered
                        // however, raised events are not given to invoke creators so we have to fallback handling WHEEL_PRESSED event
                        // in reality, because of this issue, ENABLE_PANNING that we can receive here won't ever hold any `sessionSeed` (as that is only coming from the wheel-oriented interaction)
                        ev.type === 'ENABLE_PANNING'
                          ? ev.sessionSeed
                          : (
                              ev as Extract<
                                typeof ev,
                                { type: 'WHEEL_PRESSED' }
                              >
                            ).data,
                    }),
                },
                on: {
                  DISABLE_PANNING: 'disabled',
                },
                initial: 'idle',
                states: {
                  idle: {
                    meta: {
                      cursor: 'grab',
                    },
                    on: {
                      DRAG_SESSION_STARTED: 'active',
                    },
                  },
                  active: {
                    initial: 'grabbed',
                    on: {
                      DRAG_SESSION_STOPPED: '.done',
                    },
                    states: {
                      grabbed: {
                        meta: {
                          cursor: 'grabbing',
                        },
                        on: {
                          POINTER_MOVED_BY: {
                            target: 'dragging',
                            actions: 'sendPanChange',
                          },
                        },
                      },
                      dragging: {
                        meta: {
                          cursor: 'grabbing',
                        },
                        on: {
                          POINTER_MOVED_BY: { actions: 'sendPanChange' },
                        },
                      },
                      done: {
                        type: 'final',
                      },
                    },
                    onDone: 'idle',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      disableTextSelection: (ctx) => {
        const node = ctx.ref!.current!;
        node.style.userSelect = 'none';
      },
      enableTextSelection: (ctx) => {
        const node = ctx.ref!.current!;
        node.style.userSelect = 'unset';
      },
    },
    services: {
      wheelPressListener: (ctx) => (sendBack) => {
        const node = ctx.ref!.current!;
        const listener = (ev: PointerEvent) => {
          if (ev.button === 1) {
            sendBack(
              dragModel.events.WHEEL_PRESSED({
                pointerId: ev.pointerId,
                point: {
                  x: ev.pageX,
                  y: ev.pageY,
                },
              }),
            );
          }
        };
        node.addEventListener('pointerdown', listener);
        return () => node.removeEventListener('pointerdown', listener);
      },
      invokeDetectLock: () => (sendBack) => {
        function keydownListener(e: KeyboardEvent) {
          const target = e.target as HTMLElement;

          if (e.code === 'Space' && !isAcceptingSpaceNatively(target)) {
            e.preventDefault();
            sendBack('LOCK');
          }
        }

        window.addEventListener('keydown', keydownListener);
        return () => {
          window.removeEventListener('keydown', keydownListener);
        };
      },
      invokeDetectRelease: () => (sendBack) => {
        // TODO: we should release in more scenarios
        // e.g.:
        // - when the window blurs (without this we might get stuck in the locked state without Space actually being held down)
        // - when unrelated keyboard keys get pressed (without this other actions might be executed while dragging which often might not be desired)
        function keyupListener(e: KeyboardEvent) {
          if (e.code === 'Space') {
            e.preventDefault();
            sendBack('RELEASE');
          }
        }

        window.addEventListener('keyup', keyupListener);
        return () => {
          window.removeEventListener('keyup', keyupListener);
        };
      },
    },
  },
);

const [_CanvasDragProvider, useCanvasDrag, createCanvasDragSelector] =
  createInterpreterContext<InterpreterFrom<typeof dragMachine>>('CanvasDrag');

export const CanvasDragProvider = ({
  children,
  pannable = true,
}: {
  children: React.ReactNode;
  pannable?: boolean;
}) => {
  const canvasService = useCanvas();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const canvasDragService = useInterpret(dragMachine, {
    actions: {
      sendPanChange: actions.send(
        (_, ev: any) => {
          // we need to translate a pointer move to the viewbox move
          // and that is going into the opposite direction than the pointer
          return canvasModel.events.PAN(-ev.delta.x, -ev.delta.y);
        },
        { to: canvasService as any },
      ),
    },
    guards: {
      isPanDisabled: () => !pannable,
    },
    context: {
      ...dragModel.initialContext,
      ref: canvasRef,
    },
  });

  return (
    <_CanvasDragProvider value={canvasDragService}>
      {children}
    </_CanvasDragProvider>
  );
};

export { useCanvasDrag };
export const useIsPanModeEnabled = createCanvasDragSelector((state) =>
  state.hasTag('panMode'),
);
