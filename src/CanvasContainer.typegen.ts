// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    sendPanChange: 'POINTER_MOVED_BY';
    enableTextSelection: string;
    disableTextSelection: 'ENABLE_PANNING';
  };
  internalEvents: {};
  invokeSrcNameMap: {
    invokeDetectLock: 'done.invoke.(machine).enabled.mode.lockable.released:invocation[0]';
    wheelPressListener: 'done.invoke.(machine).enabled.mode.lockable.released:invocation[1]';
    invokeDetectRelease: 'done.invoke.(machine).enabled.mode.lockable.locked:invocation[0]';
  };
  missingImplementations: {
    actions: 'sendPanChange';
    services: never;
    guards: 'isPanDisabled';
    delays: never;
  };
  eventsCausingServices: {
    invokeDetectLock: 'RELEASE' | 'DRAG_SESSION_STOPPED';
    wheelPressListener: 'RELEASE' | 'DRAG_SESSION_STOPPED';
    invokeDetectRelease: 'LOCK';
  };
  eventsCausingGuards: {
    isPanDisabled: string;
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'checking_if_disabled'
    | 'permanently_disabled'
    | 'enabled'
    | 'enabled.mode'
    | 'enabled.mode.lockable'
    | 'enabled.mode.lockable.released'
    | 'enabled.mode.lockable.locked'
    | 'enabled.mode.lockable.wheelPressed'
    | 'enabled.mode.pan'
    | 'enabled.panning'
    | 'enabled.panning.disabled'
    | 'enabled.panning.enabled'
    | 'enabled.panning.enabled.idle'
    | 'enabled.panning.enabled.active'
    | 'enabled.panning.enabled.active.grabbed'
    | 'enabled.panning.enabled.active.dragging'
    | 'enabled.panning.enabled.active.done'
    | {
        enabled?:
          | 'mode'
          | 'panning'
          | {
              mode?:
                | 'lockable'
                | 'pan'
                | { lockable?: 'released' | 'locked' | 'wheelPressed' };
              panning?:
                | 'disabled'
                | 'enabled'
                | {
                    enabled?:
                      | 'idle'
                      | 'active'
                      | { active?: 'grabbed' | 'dragging' | 'done' };
                  };
            };
      };
  tags: never;
}
