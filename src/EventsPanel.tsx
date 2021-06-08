import { useService } from '@xstate/react';
import React, { useContext } from 'react';
import { SimulationContext } from './SimulationContext';

export const EventsPanel: React.FC = () => {
  const [state] = useService(useContext(SimulationContext));

  console.log(state);

  return (
    <div>
      <ul>
        {state.context.machines.map((machine) => {
          return <li key={machine.id}>{machine.id}</li>;
        })}
      </ul>
    </div>
  );
};
