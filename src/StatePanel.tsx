import React, { useCallback, useContext } from 'react';
import { SimulationContext } from './SimulationContext';
import ReactJson from 'react-json-view';
import { useSelector, useService } from '@xstate/react';

const selectState = (state: any) => state.context.state;
export const StatePanel: React.FC = () => {
  const [state] = useService(useContext(SimulationContext));

  return (
    <div>
      <ReactJson src={state.context.state.toJSON()} theme="monokai" />
    </div>
  );
};
