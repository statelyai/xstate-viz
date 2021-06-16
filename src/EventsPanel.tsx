import { useService } from '@xstate/react';
import React from 'react';
import { useSimulation } from './useSimulation';

export const EventsPanel: React.FC = () => {
  const [state] = useService(useSimulation());

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
