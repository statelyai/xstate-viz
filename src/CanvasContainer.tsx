import React, { CSSProperties, useEffect, useRef } from 'react';
import { canvasModel, ZoomFactor } from './canvasMachine';
import { useCanvas } from './CanvasContext';
import { useMachine } from '@xstate/react';
import {
  assign,
  actions,
  sendParent,
  ContextFrom,
  SpecialTargets,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';
import { isAcceptingSpaceNatively, isWithPlatformMetaKey } from './utils';
import { useEmbed } from './embedContext';
import { AnyState } from './types';

interface DragSession {
  pointerId: number;
  point: Point;
}

interface PointDelta {
  x: number;
  y: number;
}

const dragSessionModel = createModel(
  {
    session: null as DragSession | null,
    ref: null as React.MutableRefObject<HTMLElement> | null,
  },
  {
    events: {
      DRAG_SESSION_STARTED: ({ pointerId, point }: DragSession) => ({
        pointerId,
        point,
      }),
      DRAG_SESSION_STOPPED: () => ({}),
      DRAG_POINT_MOVED: ({ point }: Pick<DragSession, 'point'>) => ({ point }),
    },
  },
);

const dragSessionTracker = dragSessionModel.createMachine(
  {
    preserveActionOrder: true,
    initial: 'idle',
    states: {
      idle: {
        invoke: {
          id: 'dragSessionStartedListener',
          src:
            ({ ref }) =>
            (sendBack) => {
              const node = ref!.current!;
              const listener = (ev: PointerEvent) => {
                const isMouseLeftButton = ev.button === 0;
                if (isMouseLeftButton) {
                  sendBack(
                    dragSessionModel.events.DRAG_SESSION_STARTED({
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
        },
        on: {
          DRAG_SESSION_STARTED: {
            target: 'active',
            actions: actions.forwardTo(SpecialTargets.Parent),
          },
        },
      },
      active: {
        entry: ['capturePointer', 'setSessionData'],
        exit: ['releasePointer', 'clearSessionData'],
        invoke: {
          id: 'dragSessionListeners',
          src:
            ({ ref, session }) =>
            (sendBack) => {
              const node = ref!.current!;

              const moveListener = (ev: PointerEvent) => {
                if (ev.pointerId !== session!.pointerId) {
                  return;
                }
                sendBack(
                  dragSessionModel.events.DRAG_POINT_MOVED({
                    point: { x: ev.pageX, y: ev.pageY },
                  }),
                );
              };
              const stopListener = (ev: PointerEvent) => {
                if (ev.pointerId !== session!.pointerId) {
                  return;
                }
                sendBack(dragSessionModel.events.DRAG_SESSION_STOPPED());
              };
              node.addEventListener('pointermove', moveListener);
              node.addEventListener('pointerup', stopListener);
              node.addEventListener('pointercancel', stopListener);

              return () => {
                node.removeEventListener('pointermove', moveListener);
                node.removeEventListener('pointerup', stopListener);
                node.removeEventListener('pointercancel', stopListener);
              };
            },
        },
        on: {
          DRAG_POINT_MOVED: {
            actions: ['sendPointDelta', 'updatePoint'],
          },
          DRAG_SESSION_STOPPED: {
            target: 'idle',
            actions: actions.forwardTo(SpecialTargets.Parent),
          },
        },
      },
    },
  },
  {
    actions: {
      capturePointer: ({ ref }, ev: any) =>
        ref!.current!.setPointerCapture(ev!.pointerId),
      releasePointer: ({ ref, session }) =>
        ref!.current!.releasePointerCapture(session!.pointerId),
      setSessionData: assign({
        session: (ctx, ev: any) => ({
          pointerId: ev.pointerId,
          point: ev.point,
        }),
      }),
      clearSessionData: assign({
        session: null,
      }) as any,
      updatePoint: assign({
        session: (ctx, ev: any) => ({
          ...ctx.session!,
          point: ev.point,
        }),
      }),
      sendPointDelta: sendParent(
        (
          ctx: ContextFrom<typeof dragSessionModel>,
          ev: ReturnType<typeof dragSessionModel.events.DRAG_POINT_MOVED>,
        ) => ({
          type: 'POINTER_MOVED_BY',
          delta: {
            x: ctx.session!.point.x - ev.point.x,
            y: ctx.session!.point.y - ev.point.y,
          },
        }),
      ) as any,
    },
  },
);

const dragModel = createModel(
  {
    ref: null as React.MutableRefObject<HTMLElement> | null,
  },
  {
    events: {
      LOCK: () => ({}),
      RELEASE: () => ({}),
      ENABLE_PANNING: () => ({}),
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
                    invoke: {
                      src: 'invokeDetectLock',
                    },
                    on: {
                      LOCK: 'locked',
                    },
                  },
                  locked: {
                    entry: actions.raise(
                      dragModel.events.ENABLE_PANNING(),
                    ) as any,
                    exit: actions.raise(
                      dragModel.events.DISABLE_PANNING(),
                    ) as any,
                    on: { RELEASE: 'released' },
                    invoke: {
                      src: 'invokeDetectRelease',
                    },
                  },
                },
                on: {
                  ENABLE_PAN_MODE: 'pan',
                },
              },
              pan: {
                entry: actions.raise(dragModel.events.ENABLE_PANNING()) as any,
                exit: actions.raise(dragModel.events.DISABLE_PANNING()) as any,
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
                  src: (ctx) =>
                    dragSessionTracker.withContext({
                      ...dragSessionModel.initialContext,
                      ref: ctx.ref,
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

const getCursorByState = (state: AnyState) =>
  (
    Object.values(state.meta).find((m) =>
      Boolean((m as { cursor?: CSSProperties['cursor'] }).cursor),
    ) as { cursor?: CSSProperties['cursor'] }
  )?.cursor;

export const CanvasContainer: React.FC<{ panModeEnabled: boolean }> = ({
  children,
  panModeEnabled,
}) => {
  const canvasService = useCanvas();
  const embed = useEmbed();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const [state, send] = useMachine(dragMachine, {
    actions: {
      sendPanChange: actions.send(
        (_, ev: any) => {
          return canvasModel.events.PAN(ev.delta.x, ev.delta.y);
        },
        { to: canvasService as any },
      ),
    },
    guards: {
      isPanDisabled: () => !!embed?.isEmbedded && !embed.pan,
    },
    context: {
      ...dragModel.initialContext,
      ref: canvasRef,
    },
  });

  React.useEffect(() => {
    if (panModeEnabled) {
      send(dragModel.events.ENABLE_PAN_MODE());
    } else {
      send(dragModel.events.DISABLE_PAN_MODE());
    }
  }, [panModeEnabled]);

  /**
   * Observes the canvas's size and reports it to the canvasService
   */
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) return;

      canvasService.send({
        type: 'CANVAS_RECT_CHANGED',
        height: entry.contentRect.height,
        width: entry.contentRect.width,
        offsetX: entry.contentRect.left,
        offsetY: entry.contentRect.top,
      });
    });

    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasService]);

  /**
   * Tracks Wheel Event on canvas
   */
  useEffect(() => {
    const onCanvasWheel = (e: WheelEvent) => {
      const isZoomEnabled = !embed?.isEmbedded || embed.zoom;
      const isPanEnabled = !embed?.isEmbedded || embed.pan;

      if (isZoomEnabled && isWithPlatformMetaKey(e)) {
        e.preventDefault();
        if (e.deltaY > 0) {
          canvasService.send(
            canvasModel.events['ZOOM.OUT'](
              e.clientX,
              e.clientY,
              ZoomFactor.slow,
            ),
          );
        } else if (e.deltaY < 0) {
          canvasService.send(
            canvasModel.events['ZOOM.IN'](
              e.clientX,
              e.clientY,
              ZoomFactor.slow,
            ),
          );
        }
      } else if (isPanEnabled && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('wheel', onCanvasWheel);
    return () => {
      canvasEl.removeEventListener('wheel', onCanvasWheel);
    };
  }, [canvasService, embed]);

  return (
    <div
      ref={canvasRef}
      style={{
        cursor: getCursorByState(state),
        WebkitFontSmoothing: 'auto',
      }}
    >
      {children}
    </div>
  );
};
