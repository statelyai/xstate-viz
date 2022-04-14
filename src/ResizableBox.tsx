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
import { useVizOrientation } from './visualizerOrientationContext';

const resizableModel = createModel(
  {
    ref: null as React.MutableRefObject<HTMLElement> | null,
    widthDelta: 0,
    heightDelta: 0,
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
            heightDelta: (ctx, e) => {
              return Math.max(0, ctx.heightDelta - e.delta.y);
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
  const vizOrientation = useVizOrientation();

  const [state] = useMachine(
    resizableMachine.withContext({
      ...resizableModel.initialContext,
      ref,
    }),
  );

  useEffect(() => {
    if (vizOrientation.orientation === 'top/bottom') {
      onChange(state.context.heightDelta);
    } else {
      onChange(state.context.widthDelta);
    }
  }, [state.context.widthDelta, onChange, state.context.heightDelta]);

  return (
    <Box
      ref={ref}
      data-testid="resize-handle"
      width={vizOrientation.orientation === 'top/bottom' ? '100%' : '1px'}
      css={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: vizOrientation.orientation === 'top/bottom' ? '4px' : '100%',
        cursor:
          vizOrientation.orientation === 'top/bottom'
            ? 'ns-resize'
            : 'ew-resize',
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

interface ResizableBoxProps extends Omit<BoxProps, 'width' | 'height'> {
  disabled?: boolean;
}

export const ResizableBox: React.FC<ResizableBoxProps> = ({
  children,
  disabled,
  ...props
}) => {
  const [widthDelta, setWidthDelta] = useState(0);
  const [heightDelta, setHeightDelta] = useState(0);
  const vizOrientation = useVizOrientation();
  const width =
    vizOrientation.orientation === 'top/bottom'
      ? '100%'
      : `clamp(36rem, calc(36rem + ${widthDelta}px), 70vw)`;
  const height =
    vizOrientation.orientation === 'top/bottom'
      ? `clamp(36rem, calc(36rem + ${heightDelta}px), 90vh)`
      : 'auto';

  const handleSizeChange = (value: number) => {
    if (vizOrientation.orientation === 'top/bottom') {
      setHeightDelta(value);
    } else {
      setWidthDelta(value);
    }
  };

  return (
    // 35rem to avoid shortcut codes breaking
    // into multiple lines
    <Box {...props} style={!disabled ? { width, height } : undefined}>
      {children}
      {!disabled && (
        <ResizeHandle onChange={(value) => handleSizeChange(value)} />
      )}
    </Box>
  );
};
