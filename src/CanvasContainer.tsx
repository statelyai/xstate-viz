import React from 'react';

import { canvasModel } from './canvasMachine';
import { useCanvas } from './CanvasContext';

export const CanvasContainer: React.FC = ({ children }) => {
  const canvasService = useCanvas();

  return (
    <div
      data-panel="viz"
      onWheel={(e) => {
        canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }}
    >
      {children}
    </div>
  );
};
