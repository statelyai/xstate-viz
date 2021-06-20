import React from 'react';
import ReactJson from 'react-json-view';
import { useSelector } from '@xstate/react';
import { useSimulation } from './SimulationContext';

const selectState = (state: any) => state.context.state;
export const StatePanel: React.FC = () => {
  const state = useSelector(useSimulation(), selectState);

  return (
    <div>
      <ReactJson
        src={state.toJSON()}
        theme="monokai"
        collapsed={1}
        onEdit={false}
        displayDataTypes={false}
        displayObjectSize={false}
      />
    </div>
  );
};
