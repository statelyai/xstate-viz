import React from 'react';
import throttle from 'lodash.throttle';
import { canvasModel } from './canvasMachine';
import { useCanvas } from './CanvasContext';

export const CanvasContainer: React.FC = ({ children }) => {
  const canvasService = useCanvas();

  return (
    <div
      data-panel="viz"
      onWheel={(e) => {
        throttle(
          () => canvasService.send(canvasModel.events.PAN(e.deltaX, e.deltaY)),
          300,
        )();
      }}
    >
      {children}
    </div>
  );
};
