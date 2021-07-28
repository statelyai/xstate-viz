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
      on: {
        LOCK: 'locked',
      },
    },
    locked: {
      initial: 'idle',
      on: { RELEASE: 'released' },
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

export const CanvasContainer: React.FC = ({ children }) => {
  const canvasService = useCanvas();
  const [state, send] = useMachine(dragMachine);
  const canvasRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    function keydownListener(e: KeyboardEvent) {
      if (e.code === 'Space') {
        // preventDefault is needed to disable text selection while moving
        e.preventDefault();
        send('LOCK');
      }
    }
    function keyupListener(e: KeyboardEvent) {
      if (e.code === 'Space') {
        send('RELEASE');
      } else {
        send('UNGRAB');
      }
    }

    window.addEventListener('keydown', keydownListener);
    window.addEventListener('keyup', keyupListener);

    return () => {
      window.removeEventListener('keydown', keydownListener);
      window.removeEventListener('keyup', keyupListener);
    };
  }, [send]);

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
      style={{ cursor: getCursorByState(state), WebkitFontSmoothing: 'auto' }}
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
        // preventDefault is needed to disable text selection while moving
        e.preventDefault();
        send({ type: 'GRAB', point: { x: e.pageX, y: e.pageY } });
      }}
      onPointerMove={(e) => {
        // preventDefault is needed to disable text selection while moving
        e.preventDefault();
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
