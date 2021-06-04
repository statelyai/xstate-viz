import { useMachine } from '@xstate/react';
import * as React from 'react';

import { canvasMachine, canvasModel } from './canvasMachine';

export const CanvasContainer: React.FC = ({ children }) => {
  const [state, send] = useMachine(canvasMachine);

  return (
    <div
      data-panel="viz"
      onWheel={(e) => {
        send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }}
    >
      <div>
        <button onClick={() => send('ZOOM.OUT')}>-</button>
        <button onClick={() => send('ZOOM.IN')}>+</button>
      </div>
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
