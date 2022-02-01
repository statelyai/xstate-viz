import {
  assign,
  actions,
  sendParent,
  ContextFrom,
  SpecialTargets,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { Point } from './types';

export interface DragSession {
  pointerId: number;
  point: Point;
}

export interface PointDelta {
  x: number;
  y: number;
}

export const dragSessionModel = createModel(
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

export const dragSessionTracker = dragSessionModel.createMachine(
  {
    preserveActionOrder: true,
    initial: 'check_session_data',
    states: {
      check_session_data: {
        always: [
          {
            cond: (ctx) => !!ctx.session,
            target: 'active',
            actions: sendParent((ctx) =>
              dragSessionModel.events.DRAG_SESSION_STARTED(ctx.session!),
            ),
          },
          'idle',
        ],
      },
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
      capturePointer: ({ ref, session }, ev: any) =>
        ref!.current!.setPointerCapture(ev!.pointerId || session?.pointerId),
      releasePointer: ({ ref, session }) =>
        ref!.current!.releasePointerCapture(session!.pointerId),
      setSessionData: assign({
        session: (ctx, ev: any) => {
          if ('pointerId' in ev && ev.point)
            return {
              pointerId: ev.pointerId,
              point: ev.point,
            };
          return ctx.session;
        },
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
            x: ev.point.x - ctx.session!.point.x,
            y: ev.point.y - ctx.session!.point.y,
          },
        }),
      ) as any,
    },
  },
);
