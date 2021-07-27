import * as XState from 'xstate';
import * as XStateModel from 'xstate/lib/model';
import * as XStateActions from 'xstate/lib/actions';
import { StateNode } from 'xstate';

export function parseMachines(sourceJs: string): Array<StateNode> {
  // eslint-disable-next-line no-new-func
  const makeMachine = new Function('exports', 'require', sourceJs);

  const machines: Array<StateNode> = [];

  const createMachineCapturer =
    (machineFactory: any) =>
    (...args: any[]) => {
      const machine = machineFactory(...args);
      machines.push(machine);
      return machine;
    };

  makeMachine({}, (sourcePath: string) => {
    switch (sourcePath) {
      case 'xstate':
        return {
          ...XState,
          createMachine: createMachineCapturer(XState.createMachine),
          Machine: createMachineCapturer(XState.Machine),
        };
      case 'xstate/lib/actions':
        return XStateActions;
      case 'xstate/lib/model':
        const { createModel } = XStateModel;
        return {
          ...XStateModel,
          createModel(initialContext: any, creators: any) {
            const model = createModel(initialContext, creators);
            return {
              ...model,
              createMachine: createMachineCapturer(model.createMachine),
            };
          },
        };
      default:
        throw new Error(`External module ("${sourcePath}") can't be used.`);
    }
  });

  return machines;
}
