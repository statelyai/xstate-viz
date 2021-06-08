import { ActorRefFrom, createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { createSimulationMachine } from './simulationMachine';

export const systemModel = createModel({
  machines: [] as Array<
    ActorRefFrom<ReturnType<typeof createSimulationMachine>>
  >,
});

export const systemMachine = createMachine<typeof systemModel>({
  context: systemModel.initialContext,
});
