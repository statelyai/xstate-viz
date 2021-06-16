import { useContext } from 'react';
import { SimulationContext } from './SimulationContext';

export const useSimulation = () => {
  const sim = useContext(SimulationContext);
  if (sim === undefined) {
    throw Error(
      'SimulationContext must be used inside SimulationContext.Provider',
    );
  }
  return sim;
};
