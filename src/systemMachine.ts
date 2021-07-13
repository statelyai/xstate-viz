import { ActorRefFrom, createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { simulationMachine } from './simulationMachine';

export const systemModel = createModel({
  machines: [] as Array<ActorRefFrom<typeof simulationMachine>>,
});

export const systemMachine = createMachine<typeof systemModel>({
  context: systemModel.initialContext,
});
