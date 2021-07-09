import { assign, createMachine } from 'xstate';
import { AnyState, AnyStateMachine, ServiceRefEvents } from './types';

export function createServiceMachine(
  machine: AnyStateMachine,
  sessionId: string,
) {
  return createMachine<
    {
      machine: AnyStateMachine;
      sessionId: string;
      state: AnyState;
    },
    ServiceRefEvents
  >({
    context: {
      machine,
      sessionId,
      state: machine.initialState,
    },
    on: {
      'xstate.state': {
        actions: assign({
          state: (_, e) => e.state,
        }),
      },
    },
  });
}
