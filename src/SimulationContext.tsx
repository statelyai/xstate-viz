import { InterpreterFrom } from 'xstate';
import { simulationMachine } from './simulationMachine';
import { createInterpreterContext } from './utils';
import { SimulationMode } from './types';

const [SimulationProvider, useSimulation, createSimulationSelector] =
  createInterpreterContext<InterpreterFrom<typeof simulationMachine>>(
    'Simulation',
  );

export { SimulationProvider, useSimulation };

export const useSimulationMode = createSimulationSelector<SimulationMode>(
  (state) => (state.hasTag('inspecting') ? 'inspecting' : 'visualizing'),
);
