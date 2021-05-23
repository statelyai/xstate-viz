import React, { useContext } from 'react';
import { StateNodeViz } from './StateNodeViz';
import { useService } from '@xstate/react';
import { SimulationContext } from './App';

export const MachineViz = () => {
  const simService = useContext(SimulationContext);
  const [state, send] = useService(simService);

  return (
    <div style={{ opacity: 0.1 }}>
      <StateNodeViz
        stateNode={state.context.machine}
        key={state.context.machine.version}
      />
    </div>
  );
};
