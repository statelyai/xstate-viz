// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    copyLinkToClipboard: 'xstate.after(250)#shareMachine.pending';
  };
  internalEvents: {
    'xstate.after(250)#shareMachine.pending': {
      type: 'xstate.after(250)#shareMachine.pending';
    };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: 'copyLinkToClipboard';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: 'notCopied' | 'pending' | 'copied';
  tags: 'loading' | 'copied';
}
