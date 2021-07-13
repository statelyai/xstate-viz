import { InterpreterFrom } from 'xstate';
import { simulationMachine } from './simulationMachine';
import { createRequiredContext } from './utils';

export const [SimulationProvider, useSimulation] =
  createRequiredContext<InterpreterFrom<typeof simulationMachine>>(
    'Simulation',
  );
