// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    saveParams: 'PARAMS_CHANGED';
    makeEmbedUrlAndCode: 'PARAMS_CHANGED';
    makePreviewUrl: 'PARAMS_CHANGED';
    updateEmbedCopy: 'PARAMS_CHANGED';
  };
  internalEvents: {};
  invokeSrcNameMap: {};
  missingImplementations: {
    actions:
      | 'saveParams'
      | 'makeEmbedUrlAndCode'
      | 'makePreviewUrl'
      | 'updateEmbedCopy';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | 'form'
    | 'form.ready'
    | 'iframe'
    | 'iframe.idle'
    | 'iframe.updating'
    | 'iframe.loading'
    | 'iframe.loaded'
    | 'iframe.error'
    | {
        form?: 'ready';
        iframe?: 'idle' | 'updating' | 'loading' | 'loaded' | 'error';
      };
  tags: 'preview_loading' | 'preview_error';
}
