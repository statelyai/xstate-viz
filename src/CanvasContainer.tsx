import React from 'react';

import { canvasModel } from './canvasMachine';
import { useCanvas } from './useCanvas';

export const CanvasContainer: React.FC = ({ children }) => {
  const [state, send] = useCanvas();
  return (
    <div
      data-panel="viz"
      onWheel={(e) => {
        send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }}
    >
      <div
        style={{
          transform: `translate(${state.context.pan.dx}px, ${state.context.pan.dy}px) scale(${state.context.zoom})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
