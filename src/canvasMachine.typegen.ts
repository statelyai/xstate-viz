// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    assignAfterZoomIn: 'ZOOM.IN';
    resetPosition: 'POSITION.RESET';
    setPositionAfterSourceChanged: 'SOURCE_CHANGED';
    assignZoomAfterFitToContent: 'FIT_TO_CONTENT';
    assignViewBoxAfterFitToContent: 'FIT_TO_CONTENT';
    persistPositionToLocalStorage: string;
  };
  internalEvents: {};
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: 'persistPositionToLocalStorage';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {
    canZoomIn: 'ZOOM.IN';
  };
  eventsCausingDelays: {};
  matchesStates: 'idle' | 'throttling' | 'saving';
  tags: never;
}
