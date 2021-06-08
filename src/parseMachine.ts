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

  const interpretProxy = (machine: any, ...args: any[]) => {
    machines.push(machine);
    return interpret(machine, ...args);
  };

  makeMachine(
    createMachine,
    createMachine,
    interpretProxy,
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
