import { Box } from '@chakra-ui/react';
import { useMachine } from '@xstate/react';
import { useEffect, useState } from 'react';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';

const dragDropModel = createModel(
  {
    prevWidth: 300,
    width: 300,
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
            width: (ctx, e) => {
              return Math.max(0, ctx.prevWidth + (ctx.point.x - e.point.x));
            },
          }),
        },
        'DRAG.END': {
          target: 'idle',
          actions: dragDropModel.assign({
            point: (ctx) => ctx.dragPoint,
            prevWidth: (ctx) => ctx.width,
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
    onChange(state.context.width);
  }, [state.context.width, onChange]);

  return (
    <Box
      data-viz="resizeHandle"
      width="1"
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
        send(
          dragDropModel.events['DRAG.START']({ x: e.clientX, y: e.clientY }),
        );
      }}
      onPointerMove={(e) => {
        send(dragDropModel.events['DRAG.MOVE']({ x: e.clientX, y: e.clientY }));
      }}
      onPointerUp={(e) => {
        send(dragDropModel.events['DRAG.END']());
      }}
    ></Box>
  );
};

export const ResizableBox: React.FC<{ gridArea?: string }> = ({
  gridArea, // TODO: figure out how to add Box prop types
  children,
}) => {
  const [width, setWidth] = useState(300);

  return (
    <Box width={`${width}px`} gridArea={gridArea}>
      {children}
      <ResizeHandle onChange={(value) => setWidth(value)} />
    </Box>
  );
};
