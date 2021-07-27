import type {
  AnyEventObject,
  AnyInterpreter,
  State,
  StateMachine,
} from 'xstate';
import { Model } from 'xstate/lib/model.types';

export type AnyStateMachine = StateMachine<any, any, any>;

export type StateFrom<T> = T extends StateMachine<
  infer TContext,
  any,
  infer TEvent
>
  ? State<TContext, TEvent>
  : T extends Model<infer TContext, infer TEvent>
  ? State<TContext, TEvent, any, any>
  : never;

export type AnyState = State<any, any>;

export type SourceProvider = 'gist' | 'registry';

export type ServiceRefEvents =
  | {
      type: 'xstate.event';
      event: AnyEventObject;
    }
  | {
      type: 'xstate.state';
      state: AnyState;
    };

export interface ServiceData {
  sessionId: string;
  machine: AnyStateMachine;
  state: AnyState;
  status?: AnyInterpreter['status'];
  source?: 'inspector' | 'visualizer';
}

export type SimMode = 'inspecting' | 'visualizing';
