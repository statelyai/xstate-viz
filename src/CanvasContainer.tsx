import { useSelector } from '@xstate/react';
import React from 'react';

import { canvasModel } from './canvasMachine';
import { useCanvas } from './CanvasContext';

export const CanvasContainer: React.FC = ({ children }) => {
  const canvasService = useCanvas();
  const { pan, zoom } = useSelector(canvasService, (s) => s.context);

  return (
    <div
      data-panel="viz"
      onWheel={(e) => {
        canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }}
    >
      <div
        style={{
          transform: `translate(${pan.dx}px, ${pan.dy}px) scale(${zoom})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
