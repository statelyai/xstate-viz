// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    onChangedCodeValue: 'EDITOR_CHANGED_VALUE';
    clearDecorations: 'EDITOR_CHANGED_VALUE';
    onChange: 'UPDATE_MACHINE_PRESSED';
    broadcastError:
      | 'error.platform.(machine).booting.fixing_gist_imports:invocation[0]'
      | 'error.platform.(machine).compiling:invocation[0]';
    assignParsedMachinesToContext: 'done.invoke.(machine).compiling:invocation[0]';
    addDecorations: 'error.platform.(machine).compiling:invocation[0]';
    scrollToLineWithError: 'error.platform.(machine).compiling:invocation[0]';
  };
  internalEvents: {
    'error.platform.(machine).booting.fixing_gist_imports:invocation[0]': {
      type: 'error.platform.(machine).booting.fixing_gist_imports:invocation[0]';
      data: unknown;
    };
    'error.platform.(machine).compiling:invocation[0]': {
      type: 'error.platform.(machine).compiling:invocation[0]';
      data: unknown;
    };
    'done.invoke.(machine).compiling:invocation[0]': {
      type: 'done.invoke.(machine).compiling:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
  };
  invokeSrcNameMap: {
    parseMachines: 'done.invoke.(machine).compiling:invocation[0]';
  };
  missingImplementations: {
    actions: 'onChangedCodeValue' | 'onChange';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    parseMachines: 'COMPILE' | 'done.state.(machine).booting';
  };
  eventsCausingGuards: {
    isGist: 'EDITOR_READY';
    isSyntaxError: 'error.platform.(machine).compiling:invocation[0]';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'booting'
    | 'booting.waiting_for_monaco'
    | 'booting.fixing_gist_imports'
    | 'booting.done'
    | 'active'
    | 'updating'
    | 'compiling'
    | { booting?: 'waiting_for_monaco' | 'fixing_gist_imports' | 'done' };
  tags: 'visualizing';
}
