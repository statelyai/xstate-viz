import React, { useCallback, useContext } from 'react';
import { SimulationContext } from './SimulationContext';
import ReactJson from 'react-json-view';
import { useSelector, useService } from '@xstate/react';

const selectState = (state: any) => state.context.state;
export const StatePanel: React.FC = () => {
  const state = useSelector(useContext(SimulationContext), selectState);

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
