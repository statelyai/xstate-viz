// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    signOutUser: 'SIGN_OUT';
    signInUser: 'SIGN_IN';
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
  matchesStates:
    | 'initializing'
    | 'checking_if_signed_in'
    | 'signed_out'
    | 'signed_out.idle'
    | 'signed_out.choosing_provider'
    | 'signed_in'
    | 'signed_in.fetchingUser'
    | 'signed_in.idle'
    | 'signing_in'
    | {
        signed_out?: 'idle' | 'choosing_provider';
        signed_in?: 'fetchingUser' | 'idle';
      };
  tags: 'authorized';
}
