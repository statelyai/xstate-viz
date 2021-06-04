import { createContext } from 'react';
import { InterpreterOf } from './types';
import { createSimulationMachine } from './simulationMachine';

export const SimulationContext = createContext<
  InterpreterOf<ReturnType<typeof createSimulationMachine>>
>(null as any);
