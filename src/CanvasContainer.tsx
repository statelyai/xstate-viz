import React, { CSSProperties, useEffect, useRef } from 'react';
import { canvasModel, ZoomFactor } from './canvasMachine';
import { useCanvas } from './CanvasContext';
import { useMachine } from '@xstate/react';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';
import {
  isWithPlatformMetaKey,
  isTextInputLikeElement,
  isTabLikeElement,
} from './utils';
import { AnyState } from './types';

const dragModel = createModel(
  {
    startPoint: { x: 0, y: 0 },
    dragPoint: { x: 0, y: 0 },
    dx: 0,
    dy: 0,
  },
  {
    events: {
      LOCK: () => ({}),
      RELEASE: () => ({}),
      GRAB: (point: Point) => ({ point }),
      DRAG: (point: Point) => ({ point }),
      UNGRAB: () => ({}),
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
      invoke: {
        src: 'invokeDetectRelease',
      },
      states: {
        idle: {
          meta: {
            cursor: 'grab',
          },
          on: {
            GRAB: {
              target: 'grabbed',
              actions: dragModel.assign({
                startPoint: (_, e) => e.point,
                dragPoint: (_, e) => e.point,
              }),
            },
          },
        },
        grabbed: {
          meta: {
            cursor: 'grabbing',
          },
          on: {
            DRAG: 'dragging',
            UNGRAB: 'idle',
          },
        },
        dragging: {
          tags: ['dragging'],
          meta: {
            cursor: 'grabbing',
          },
          entry: [
            dragModel.assign({
              dragPoint: (_, e: ReturnType<typeof dragModel.events.DRAG>) =>
                e.point,
              dx: (ctx, e) => ctx.dragPoint.x - e.point.x,
              dy: (ctx, e) => ctx.dragPoint.y - e.point.y,
            }) as any,
          ],
          on: {
            DRAG: { target: 'dragging', internal: false },
            UNGRAB: 'idle',
          },
        },
      },
    },
  },
});

const getCursorByState = (state: AnyState) =>
  (Object.values(state.meta)[0] as { cursor: CSSProperties['cursor'] }).cursor;

const getPanDelta = (
  negative: string[],
  positive: string[],
  key: string,
  isShift = false,
): number => {
  const delta = isShift ? 50 : 5;

  if (positive.includes(key)) {
    return delta;
  } else if (negative.includes(key)) {
    return -delta;
  }

  return 0;
};

const getDeltaX = getPanDelta.bind(
  null,
  ['a', 'A', 'ArrowLeft'],
  ['d', 'D', 'ArrowRight'],
);
const getDeltaY = getPanDelta.bind(
  null,
  ['w', 'W', 'ArrowUp'],
  ['s', 'S', 'ArrowDown'],
);

export const CanvasContainer: React.FC = ({ children }) => {
  const canvasService = useCanvas();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const [state, send] = useMachine(
    dragMachine.withConfig({
      actions: {
        disableTextSelection: () => {
          canvasRef.current.style.userSelect = 'none';
        },
        enableTextSelection: () => {
          canvasRef.current.style.userSelect = 'unset';
        },
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
    }),
  );

  useEffect(() => {
    if (state.hasTag('dragging')) {
      canvasService.send(
        canvasModel.events.PAN(state.context.dx, state.context.dy),
      );
    }
  }, [state, canvasService]);

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

  /**
   * Keyboard events.
   */
  useEffect(() => {
    function keydownListener(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (isTextInputLikeElement(target) || isTabLikeElement(target)) {
        return;
      }

      const dx = getDeltaX(e.key, e.shiftKey);
      const dy = getDeltaY(e.key, e.shiftKey);

      if (e.key === '+') {
        e.preventDefault();
        canvasService.send('ZOOM.IN');
      } else if (e.key === '-') {
        e.preventDefault();
        canvasService.send('ZOOM.OUT');
      } else if (e.key === 'r') {
        e.preventDefault();
        canvasService.send('POSITION.RESET');
      } else if (e.key === 'f') {
        e.preventDefault();
        canvasService.send('FIT_TO_VIEW');
      } else if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        canvasService.send(canvasModel.events.PAN(dx, dy));
      }
    }

    window.addEventListener('keydown', keydownListener);
    return () => {
      window.removeEventListener('keydown', keydownListener);
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        cursor: getCursorByState(state),
        WebkitFontSmoothing: 'auto',
      }}
      onPointerDown={(e) => {
        if (state.nextEvents.includes('GRAB')) {
          e.currentTarget.setPointerCapture(e.pointerId);
          send({ type: 'GRAB', point: { x: e.pageX, y: e.pageY } });
        }
      }}
      onPointerMove={(e) => {
        if (state.nextEvents.includes('DRAG')) {
          send({ type: 'DRAG', point: { x: e.pageX, y: e.pageY } });
        }
      }}
      onPointerUp={() => {
        if (state.nextEvents.includes('UNGRAB')) {
          send('UNGRAB');
        }
      }}
    >
      {children}
    </div>
  );
};
