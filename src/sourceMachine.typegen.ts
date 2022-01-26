// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    openNewWindowAtRoot: 'CREATE_NEW';
    addForkOfToDesiredName: 'FORK' | 'SAVE';
    assignExampleMachineToContext: 'EXAMPLE_REQUESTED';
    clearLocalStorageEntryForCurrentSource: 'done.invoke.(machine).creating.pendingSave:invocation[0]';
    assignCreateSourceFileToContext: 'done.invoke.(machine).creating.pendingSave:invocation[0]';
    updateURLWithMachineID: 'done.invoke.(machine).creating.pendingSave:invocation[0]';
    showSaveErrorToast: 'error.platform.(machine).creating.pendingSave:invocation[0]';
    assignSourceFileToContext: 'done.invoke.updating:invocation[0]';
    redirectToNewUrlFromLegacyUrl: string;
    parseQueries: 'done.state.(machine).checking_if_on_legacy_url';
    getLocalStorageCachedSource:
      | 'LOADED_FROM_REGISTRY'
      | 'CLOSE_NAME_CHOOSER_MODAL'
      | 'error.platform.updating:invocation[0]';
  };
  internalEvents: {
    'done.invoke.(machine).creating.pendingSave:invocation[0]': {
      type: 'done.invoke.(machine).creating.pendingSave:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.(machine).creating.pendingSave:invocation[0]': {
      type: 'error.platform.(machine).creating.pendingSave:invocation[0]';
      data: unknown;
    };
    'done.invoke.updating:invocation[0]': {
      type: 'done.invoke.updating:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.updating:invocation[0]': {
      type: 'error.platform.updating:invocation[0]';
      data: unknown;
    };
  };
  invokeSrcNameMap: {
    loadSourceContent: 'done.invoke.(machine).with_source.loading_content:invocation[0]';
    createSourceFile: 'done.invoke.(machine).creating.pendingSave:invocation[0]';
    updateSourceFile: 'done.invoke.updating:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    loadSourceContent: string;
    updateSourceFile: 'SAVE';
    createSourceFile: 'CHOOSE_NAME';
  };
  eventsCausingGuards: {
    hasIdOnQueryParams: string;
    hasLocalStorageCachedSource: string;
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'checking_initial_data'
    | 'checking_if_on_legacy_url'
    | 'checking_if_on_legacy_url.checking_if_id_on_query_params'
    | 'checking_if_on_legacy_url.redirecting'
    | 'checking_if_on_legacy_url.check_complete'
    | 'checking_url'
    | 'with_source'
    | 'with_source.loading_content'
    | 'with_source.source_loaded'
    | 'with_source.source_loaded.checking_if_user_owns_source'
    | 'with_source.source_loaded.user_owns_this_source'
    | 'with_source.source_loaded.user_does_not_own_this_source'
    | 'with_source.source_error'
    | 'no_source'
    | 'no_source.checking_if_in_local_storage'
    | 'no_source.has_cached_source'
    | 'no_source.no_cached_source'
    | 'creating'
    | 'creating.showingNameModal'
    | 'creating.pendingSave'
    | 'updating'
    | {
        checking_if_on_legacy_url?:
          | 'checking_if_id_on_query_params'
          | 'redirecting'
          | 'check_complete';
        with_source?:
          | 'loading_content'
          | 'source_loaded'
          | 'source_error'
          | {
              source_loaded?:
                | 'checking_if_user_owns_source'
                | 'user_owns_this_source'
                | 'user_does_not_own_this_source';
            };
        no_source?:
          | 'checking_if_in_local_storage'
          | 'has_cached_source'
          | 'no_cached_source';
        creating?: 'showingNameModal' | 'pendingSave';
      };
  tags: 'canShowWelcomeMessage' | 'noCachedSource' | 'persisting';
}
