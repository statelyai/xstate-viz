import { DirectedGraphNode } from '@xstate/graph';
import { useMachine } from '@xstate/react';
import * as React from 'react';
import { canvasMachine, canvasModel, SimulationContext } from './App';
import { Graph } from './Graph';
import { MachineViz } from './MachineViz';

export const CanvasPanel: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const simService = React.useContext(SimulationContext);
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
        <button
          onClick={() =>
            simService.send({
              type: 'EVENT',
              event: { type: 'NEXT' },
            })
          }
        >
          NEXT
        </button>
        <button onClick={() => simService.send('MACHINE.UPDATE')}>
          MACHINE
        </button>
      </div>
      <div
        style={{
          transform: `translate(${state.context.pan.dx}px, ${state.context.pan.dy}px) scale(${state.context.zoom})`,
        }}
      >
        <MachineViz digraph={digraph} />
        <Graph digraph={digraph} />
      </div>
    </div>
  );
};
