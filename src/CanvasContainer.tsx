import React, { CSSProperties, useEffect, useRef } from 'react';
import { canvasModel } from './canvasMachine';
import { useCanvas } from './CanvasContext';
import { useMachine } from '@xstate/react';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';
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
        src: 'invokeDetectSpacebar',
      },
      on: {
        LOCK: 'locked',
      },
    },
    locked: {
      initial: 'idle',
      on: { RELEASE: 'released' },
      invoke: {
        src: 'invokeDetectKeyup',
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
          tags: 'dragging',
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
            'disableTextSelection',
          ],
          exit: ['enableTextSelection'],
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
        invokeDetectSpacebar: () => (sendBack) => {
          function keydownListener(e: KeyboardEvent) {
            // Need this to still be able to use Spacebar in editable elements
            if (
              ['TEXTAREA', 'INPUT', 'BUTTON'].includes(
                document.activeElement?.nodeName!,
              ) ||
              document.activeElement?.hasAttribute('contenteditable')
            ) {
              return;
            }

            if (e.code === 'Space') {
              sendBack('LOCK');
            }
          }

          window.addEventListener('keydown', keydownListener);
          return () => {
            window.removeEventListener('keydown', keydownListener);
          };
        },
        invokeDetectKeyup: () => (sendBack) => {
          function keyupListener(e: KeyboardEvent) {
            if (e.code === 'Space') {
              sendBack('RELEASE');
            } else {
              sendBack('UNGRAB');
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

  return (
    <div
      data-panel="viz"
      ref={canvasRef}
      style={{
        cursor: getCursorByState(state),
        WebkitFontSmoothing: 'auto',
      }}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.deltaY > 0) {
            canvasService.send(canvasModel.events['ZOOM.OUT']());
          } else if (e.deltaY < 0) {
            canvasService.send(canvasModel.events['ZOOM.IN']());
          }
        } else {
          canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY));
        }
      }}
      onPointerDown={(e) => {
        send({ type: 'GRAB', point: { x: e.pageX, y: e.pageY } });
      }}
      onPointerMove={(e) => {
        send({ type: 'DRAG', point: { x: e.pageX, y: e.pageY } });
      }}
      onPointerUp={() => {
        send('UNGRAB');
      }}
    >
      {children}
    </div>
  );
};
