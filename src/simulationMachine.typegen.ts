// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    resetVisualizationState: 'MACHINES.REGISTER' | 'MACHINES.RESET';
  };
  internalEvents: {};
  invokeSrcNameMap: {
    captureEventsFromChildServices: 'done.invoke.(machine):invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    captureEventsFromChildServices: string;
  };
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | 'inspecting'
    | 'visualizing'
    | 'visualizing.idle'
    | 'visualizing.pending'
    | 'visualizing.ready'
    | { visualizing?: 'idle' | 'pending' | 'ready' };
  tags: 'inspecting' | 'visualizing' | 'empty' | 'layoutPending';
}
