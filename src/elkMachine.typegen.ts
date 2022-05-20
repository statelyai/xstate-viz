// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    notifyLayoutReady: 'done.invoke.(machine).loading:invocation[0]';
    notifyLayoutPending: 'GRAPH_UPDATED';
  };
  internalEvents: {
    'done.invoke.(machine).loading:invocation[0]': {
      type: 'done.invoke.(machine).loading:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: 'notifyLayoutReady' | 'notifyLayoutPending';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: 'loading' | 'success';
  tags: never;
}
