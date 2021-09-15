import { Box, BoxProps } from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import { useEffect, useRef, useState } from 'react';
import { createModel } from 'xstate/lib/model';
import {
  actions,
  assign,
  ContextFrom,
  sendParent,
  SpecialTargets,
} from 'xstate';
import { Point } from './pathUtils';

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

const resizableModel = createModel(
  {
    ref: null as React.MutableRefObject<HTMLElement> | null,
    widthDelta: 0,
  },
  {
    events: {
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

const resizableMachine = resizableModel.createMachine({
  invoke: {
    id: 'dragSessionTracker',
    src: (ctx) =>
      dragSessionTracker.withContext({
        ...dragSessionModel.initialContext,
        ref: ctx.ref,
      }),
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        DRAG_SESSION_STARTED: 'active',
      },
    },
    active: {
      on: {
        POINTER_MOVED_BY: {
          actions: assign({
            widthDelta: (ctx, e) => {
              return Math.max(0, ctx.widthDelta + e.delta.x);
            },
          }),
        },
        DRAG_SESSION_STOPPED: 'idle',
      },
    },
  },
});

const ResizeHandle: React.FC<{
  onChange: (width: number) => void;
}> = ({ onChange }) => {
  const ref = useRef<HTMLElement>(null!);

  const [state, send] = useMachine(
    resizableMachine.withConfig(
      {
        actions: {},
      },
      {
        ...resizableModel.initialContext,
        ref,
      },
    ),
  );

  useEffect(() => {
    onChange(state.context.widthDelta);
  }, [state.context.widthDelta, onChange]);

  return (
    <Box
      ref={ref as any}
      data-testid="resize-handle"
      width="1"
      css={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        cursor: 'ew-resize',
        opacity: 0,
        transition: 'opacity 0.2s ease',
      }}
      _hover={{
        opacity: 1,
        background: 'var(--chakra-colors-blue-300)',
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'scaleX(2)',
      }}
    ></Box>
  );
};

interface ResizableBoxProps extends Omit<BoxProps, 'width'> {
  disabled?: boolean;
}

export const ResizableBox: React.FC<ResizableBoxProps> = ({
  children,
  disabled,
  ...props
}) => {
  const [widthDelta, setWidthDelta] = useState(0);

  return (
    // 35rem to avoid shortcut codes breaking
    // into multiple lines
    <Box
      {...props}
      style={
        !disabled
          ? { width: `clamp(35rem, calc(35rem + ${widthDelta}px), 70vw)` }
          : undefined
      }
    >
      {children}
      {!disabled && <ResizeHandle onChange={(value) => setWidthDelta(value)} />}
    </Box>
  );
};
