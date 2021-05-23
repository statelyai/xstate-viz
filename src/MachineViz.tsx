import React, { useContext } from 'react';
import { StateNodeViz } from './StateNodeViz';
import { useService } from '@xstate/react';
import { SimulationContext } from './App';

export const MachineViz = () => {
  const simService = useContext(SimulationContext);
  const [state, send] = useService(simService);

  return (
    <div>
      <StateNodeViz definition={state.context.machine.definition} />
    </div>
  );
};
