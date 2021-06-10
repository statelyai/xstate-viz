import * as XState from 'xstate';
import {
  StateNode,
  createMachine,
  interpret,
  assign,
  send,
  sendParent,
  spawn,
  actions,
} from 'xstate';

export function parseMachines(sourceJs: string): Array<StateNode> {
  // eslint-disable-next-line no-new-func
  const makeMachine = new Function(
    'Machine',
    'createMachine',
    'interpret',
    'assign',
    'send',
    'sendParent',
    'spawn',
    'raise',
    'actions',
    'XState',
    sourceJs,
  );

  const machines: Array<StateNode> = [];

  const machineProxy = (config: any, options: any) => {
    const machine = createMachine(config, options);
    machines.push(machine);
    return machine;
  };

  makeMachine(
    machineProxy,
    machineProxy,
    interpret,
    assign,
    send,
    sendParent,
    spawn,
    actions.raise,
    actions,
    XState,
  );

  return machines;
}
