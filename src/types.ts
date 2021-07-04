import type { State, StateMachine } from 'xstate';

export type AnyStateMachine = StateMachine<any, any, any>;

export type StateFrom<TMachine extends AnyStateMachine> =
  TMachine extends StateMachine<infer TContext, any, infer TEvent>
    ? State<TContext, TEvent>
    : never;

export type AnyState = State<any, any>;

export type SourceProvider = 'gist' | 'registry';
