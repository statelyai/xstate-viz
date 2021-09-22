import { ActorRefFrom } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { simulationMachine } from './simulationMachine';

export const systemModel = createModel({
  machines: [] as Array<ActorRefFrom<typeof simulationMachine>>,
});

export const systemMachine = systemModel.createMachine({
  context: systemModel.initialContext,
});
