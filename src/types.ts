import type {
  AnyEventObject,
  AnyInterpreter,
  State,
  StateMachine,
} from 'xstate';
import { SourceFileFragment } from './graphql/SourceFileFragment.generated';
import { Model } from 'xstate/lib/model.types';
import type { editor } from 'monaco-editor';

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

export interface SourceRegistryData extends SourceFileFragment {
  // we can't trust SSR data to be accurate because at the moment we can use authenticated user during SSR
  // so properties like `youHaveLiked` might be initially inaccurate
  dataSource: 'ssr' | 'client';
}

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
  status: AnyInterpreter['status'];
  source: 'inspector' | 'visualizer' | 'in-app';
}

export type SimulationMode = 'inspecting' | 'visualizing';

export type EditorThemeDefinition = editor.IStandaloneThemeData & {
  name: string;
};
