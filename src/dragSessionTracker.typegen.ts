// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    sendPointDelta: 'DRAG_POINT_MOVED';
    updatePoint: 'DRAG_POINT_MOVED';
    releasePointer: string;
    clearSessionData: string;
    capturePointer: 'DRAG_SESSION_STARTED';
    setSessionData: 'DRAG_SESSION_STARTED';
  };
  internalEvents: {};
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: 'check_session_data' | 'idle' | 'active';
  tags: never;
}
