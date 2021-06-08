import { useService } from '@xstate/react';
import React, { useContext } from 'react';
import { SimulationContext } from './SimulationContext';

export const EventsPanel: React.FC = () => {
  const [state] = useService(useContext(SimulationContext));

  return (
    <div>
      <ul>
        {state.context.events.map((event, i) => {
          return (
            <li key={i}>
              <pre>{JSON.stringify(event, null, 2)}</pre>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
