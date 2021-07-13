import * as XState from 'xstate';
import { StateNode, createMachine } from 'xstate';

export function parseMachines(sourceJs: string): Array<StateNode> {
  // eslint-disable-next-line no-new-func
  const makeMachine = new Function('exports', 'require', sourceJs);

  const machines: Array<StateNode> = [];

  const machineProxy = (config: any, options: any) => {
    const machine = createMachine(config, options);
    machines.push(machine);
    return machine;
  };

  makeMachine({}, (sourcePath: string) => {
    switch (sourcePath) {
      case 'xstate':
        return {
          ...XState,
          createMachine: machineProxy,
          Machine: machineProxy,
        };
      default:
        throw new Error(`External module ("${sourcePath}") can't be used.`);
    }
  });

  return machines;
}
