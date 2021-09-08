import { Box, BoxProps } from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import { useEffect, useState } from 'react';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';

const dragDropModel = createModel(
  {
    prevWidth: 0,
    widthDelta: 0,
    dragPoint: { x: 0, y: 0 },
    point: { x: 0, y: 0 },
  },
  {
    events: {
      'DRAG.START': (point: Point) => ({ point }),
      'DRAG.MOVE': (point: Point) => ({ point }),
      'DRAG.END': () => ({}),
    },
  },
);

const dragDropMachine = dragDropModel.createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        'DRAG.START': {
          target: 'dragging',
          actions: dragDropModel.assign({ point: (_, e) => e.point }),
        },
      },
    },
    dragging: {
      on: {
        'DRAG.MOVE': {
          actions: dragDropModel.assign({
            dragPoint: (_, e) => e.point,
            widthDelta: (ctx, e) => {
              return Math.max(0, ctx.prevWidth + (ctx.point.x - e.point.x));
            },
          }),
        },
        'DRAG.END': {
          target: 'idle',
          actions: dragDropModel.assign({
            point: (ctx) => ctx.dragPoint,
            prevWidth: (ctx) => ctx.widthDelta,
          }),
        },
      },
    },
  },
});

const ResizeHandle: React.FC<{
  onChange: (width: number) => void;
}> = ({ onChange }) => {
  const [state, send] = useMachine(dragDropMachine);

  useEffect(() => {
    onChange(state.context.widthDelta);
  }, [state.context.widthDelta, onChange]);

  return (
    <Box
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
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        send(
          dragDropModel.events['DRAG.START']({ x: e.clientX, y: e.clientY }),
        );
      }}
      onPointerMove={(e) => {
        send(dragDropModel.events['DRAG.MOVE']({ x: e.clientX, y: e.clientY }));
      }}
      onPointerUp={() => {
        send(dragDropModel.events['DRAG.END']());
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
      {...(!disabled && {
        width: `clamp(35rem, calc(35rem + ${widthDelta}px), 70vw)`,
      })}
    >
      {children}
      {!disabled && <ResizeHandle onChange={(value) => setWidthDelta(value)} />}
    </Box>
  );
};
