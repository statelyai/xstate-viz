import { InterpreterFrom } from 'xstate';
import { createSimulationMachine } from './simulationMachine';
import { createRequiredContext } from './utils';

export const [SimulationProvider, useSimulation] = createRequiredContext<
  InterpreterFrom<ReturnType<typeof createSimulationMachine>>
>('Simulation');
