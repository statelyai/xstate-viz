import React, { CSSProperties, useEffect, useRef } from 'react';
import { canvasModel, ZoomFactor } from './canvasMachine';
import { useCanvas } from './CanvasContext';
import { useMachine } from '@xstate/react';
import {
  assign,
  actions,
  send,
  sendParent,
  ContextFrom,
  SpecialTargets,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';
import { isWithPlatformMetaKey, isTextInputLikeElement } from './utils';
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
                const isLeftButton = ev.button === 0;
                if (isLeftButton) {
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
        exit: ['clearSessionData'],
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

const dragMachine = dragModel.createMachine({
  initial: 'released',
  states: {
    released: {
      meta: {
        cursor: 'default',
      },
      invoke: {
        src: 'invokeDetectLock',
      },
      on: {
        LOCK: 'locked',
      },
    },
    locked: {
      initial: 'idle',
      entry: ['disableTextSelection'],
      exit: ['enableTextSelection'],
      on: { RELEASE: 'released' },
      invoke: [
        {
          src: 'invokeDetectRelease',
        },
        {
          src: (ctx) =>
            dragSessionTracker.withContext({
              ...dragSessionModel.initialContext,
              ref: ctx.ref,
            }),
        },
      ],
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
});

const getCursorByState = (state: AnyState) =>
  (Object.values(state.meta)[0] as { cursor: CSSProperties['cursor'] }).cursor;

export const CanvasContainer: React.FC = ({ children }) => {
  const canvasService = useCanvas();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const [state] = useMachine(
    dragMachine.withConfig(
      {
        actions: {
          disableTextSelection: () => {
            canvasRef.current.style.userSelect = 'none';
          },
          enableTextSelection: () => {
            canvasRef.current.style.userSelect = 'unset';
          },
          sendPanChange: send(
            (ctx, ev: any) => {
              return canvasModel.events.PAN(ev.delta.x, ev.delta.y);
            },
            { to: canvasService as any },
          ),
        },
        services: {
          invokeDetectLock: () => (sendBack) => {
            function keydownListener(e: KeyboardEvent) {
              const target = e.target as HTMLElement;

              if (isTextInputLikeElement(target)) {
                return;
              }

              if (e.code === 'Space') {
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
      {
        ...dragModel.initialContext,
        ref: canvasRef,
      },
    ),
  );

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
      if (isWithPlatformMetaKey(e)) {
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
      } else if (!e.metaKey && !e.ctrlKey) {
        canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('wheel', onCanvasWheel);
    return () => {
      canvasEl.removeEventListener('wheel', onCanvasWheel);
    };
  }, [canvasService]);

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
