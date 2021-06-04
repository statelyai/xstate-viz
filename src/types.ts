import type { Interpreter, StateMachine } from 'xstate';

export type AnyStateMachine = StateMachine<any, any, any>;

export type InterpreterOf<T> = T extends StateMachine<infer C, any, infer E>
  ? Interpreter<C, any, E>
  : never;
