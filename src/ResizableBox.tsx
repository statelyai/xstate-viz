import { Box, BoxProps } from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import { useEffect, useRef, useState } from 'react';
import { createModel } from 'xstate/lib/model';
import { assign } from 'xstate';
import {
  dragSessionModel,
  dragSessionTracker,
  PointDelta,
} from './dragSessionTracker';
import { Point } from './types';

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
              return Math.max(0, ctx.widthDelta - e.delta.x);
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
  const ref = useRef<HTMLDivElement>(null!);

  const [state] = useMachine(
    resizableMachine.withContext({
      ...resizableModel.initialContext,
      ref,
    }),
  );

  useEffect(() => {
    onChange(state.context.widthDelta);
  }, [state.context.widthDelta, onChange]);

  return (
    <Box
      ref={ref}
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
          ? { width: `clamp(36rem, calc(36rem + ${widthDelta}px), 70vw)` }
          : undefined
      }
    >
      {children}
      {!disabled && <ResizeHandle onChange={(value) => setWidthDelta(value)} />}
    </Box>
  );
};
