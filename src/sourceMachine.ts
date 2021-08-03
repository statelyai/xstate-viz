import { SupabaseAuthClient } from '@supabase/supabase-js/dist/main/lib/SupabaseAuthClient';
import { useActor, useSelector } from '@xstate/react';
import {
  ActorRefFrom,
  assign,
  ContextFrom,
  createMachine,
  DoneInvokeEvent,
  EventFrom,
  forwardTo,
  send,
  sendParent,
  spawn,
  State,
  StateFrom,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { authMachine } from './authMachine';
import { cacheCodeChangesMachine } from './cacheCodeChangesMachine';
import { confirmBeforeLeavingMachine } from './confirmLeavingService';
import {
  CreateSourceFileDocument,
  CreateSourceFileMutation,
} from './graphql/CreateSourceFile.generated';
import {
  GetSourceFileDocument,
  GetSourceFileQuery,
} from './graphql/GetSourceFile.generated';
import { SourceFileFragment } from './graphql/SourceFileFragment.generated';
import {
  UpdateSourceFileDocument,
  UpdateSourceFileMutation,
} from './graphql/UpdateSourceFile.generated';
import { localCache } from './localCache';
import { notifMachine, notifModel } from './notificationMachine';
import { gQuery, updateQueryParamsWithoutReload } from './utils';
import { SourceProvider } from './types';

export const sourceModel = createModel(
  {
    sourceID: null as string | null,
    sourceProvider: null as SourceProvider | null,
    sourceRawContent: null as string | null,
    sourceRegistryData: null as null | SourceFileFragment,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
    loggedInUserId: null! as string | null,
    desiredMachineName: null as string | null,
  },
  {
    events: {
      SAVE: () => ({}),
      FORK: () => ({}),
      CREATE_NEW: () => ({}),
      LOADED_FROM_GIST: (rawSource: string) => ({
        rawSource,
      }),
      LOADED_FROM_REGISTRY: (data: GetSourceFileQuery) => ({ data }),
      CODE_UPDATED: (code: string, sourceID: string | null) => ({
        code,
        sourceID,
      }),
      /**
       * Passed in from the parent to the child via events
       */
      LOGGED_IN_USER_ID_UPDATED: (id: string | null | undefined) => ({ id }),
      CHOOSE_NAME: (name: string) => ({ name }),
      CLOSE_NAME_CHOOSER_MODAL: () => ({}),
      MACHINE_ID_CHANGED: (id: string) => ({ id }),
    },
  },
);

export type SourceMachineActorRef = ActorRefFrom<
  ReturnType<typeof makeSourceMachine>
>;

export type SourceMachineState = State<
  ContextFrom<typeof sourceModel>,
  EventFrom<typeof sourceModel>
>;

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }

  toString() {
    return this.message;
  }
}

export const makeSourceMachine = (auth: SupabaseAuthClient) => {
  const isLoggedIn = () => {
    return Boolean(auth.session());
  };

  return createMachine<typeof sourceModel>(
    {
      initial: 'checking_url',
      context: sourceModel.initialContext,
      entry: assign({ notifRef: () => spawn(notifMachine) }),
      on: {
        LOGGED_IN_USER_ID_UPDATED: {
          actions: assign((context, event) => {
            return {
              loggedInUserId: event.id,
            };
          }),
        },
        /**
         * When the machine id changes from the sim machine,
         * set the desiredMachineName to it
         */
        MACHINE_ID_CHANGED: {
          actions: assign((context, event) => {
            return {
              desiredMachineName: event.id,
            };
          }),
        },
      },
      states: {
        checking_url: {
          entry: 'parseQueries',
          always: [
            { target: 'with_source', cond: (ctx) => Boolean(ctx.sourceID) },
            { target: 'no_source' },
          ],
        },
        with_source: {
          id: 'with_source',
          initial: 'loading_content',
          on: {
            CREATE_NEW: {
              actions: 'openNewWindowAtRoot',
            },
            FORK: [
              {
                target: '#creating',
                cond: isLoggedIn,
                actions: ['addForkOfToDesiredName'],
              },
              {
                actions: sendParent(
                  'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                ),
              },
            ],
          },
          states: {
            loading_content: {
              on: {
                LOADED_FROM_REGISTRY: [
                  {
                    target: 'source_loaded',
                    actions: assign((context, event) => {
                      return {
                        sourceID: event.data.getSourceFile?.id,
                        sourceRawContent: event.data.getSourceFile?.text,
                        sourceRegistryData: event.data.getSourceFile,
                      };
                    }),
                  },
                ],
                LOADED_FROM_GIST: {
                  target: 'source_loaded.user_does_not_own_this_source',
                  actions: assign((context, event) => {
                    return {
                      sourceRawContent: event.rawSource,
                    };
                  }),
                },
              },
              invoke: {
                src: 'loadSourceContent',
                onError: 'source_error',
              },
            },
            source_loaded: {
              entry: ['getLocalStorageCachedSource'],
              on: {
                CODE_UPDATED: {
                  actions: [
                    assign({
                      sourceRawContent: (ctx, e) => e.code,
                    }),
                    forwardTo('codeCacheMachine'),
                    forwardTo('confirmBeforeLeavingMachine'),
                  ],
                },
                LOGGED_IN_USER_ID_UPDATED: {
                  actions: assign((context, event) => {
                    return {
                      loggedInUserId: event.id,
                    };
                  }),
                  target: '.checking_if_user_owns_source',
                },
              },
              invoke: [
                {
                  src: cacheCodeChangesMachine,
                  id: 'codeCacheMachine',
                },
                {
                  src: confirmBeforeLeavingMachine,
                  id: 'confirmBeforeLeavingMachine',
                },
              ],
              initial: 'checking_if_user_owns_source',
              states: {
                checking_if_user_owns_source: {
                  always: [
                    {
                      cond: (ctx) => {
                        const ownerId = ctx.sourceRegistryData?.owner?.id;

                        if (!ownerId || !ctx.loggedInUserId) return false;

                        return ownerId === ctx.loggedInUserId;
                      },
                      target: 'user_owns_this_source',
                    },
                    {
                      target: 'user_does_not_own_this_source',
                    },
                  ],
                },
                user_owns_this_source: {
                  on: {
                    SAVE: [
                      {
                        cond: isLoggedIn,
                        target: '#updating',
                      },
                      {
                        actions: sendParent(
                          'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                        ),
                      },
                    ],
                  },
                },
                user_does_not_own_this_source: {
                  on: {
                    SAVE: [
                      {
                        cond: isLoggedIn,
                        target: '#creating',
                        actions: ['addForkOfToDesiredName'],
                      },
                      {
                        actions: sendParent(
                          'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                        ),
                      },
                    ],
                  },
                },
              },
            },
            source_error: {
              entry: [
                send(
                  (_, e: any) =>
                    notifModel.events.BROADCAST(
                      (e.data as Error).toString(),
                      'error',
                    ),
                  { to: (ctx: any) => ctx.notifRef },
                ),
                (_, e: any) => {
                  if (e.data instanceof NotFoundError) {
                    updateQueryParamsWithoutReload((queries) => {
                      queries.delete('id');
                      queries.delete('gist');
                    });
                  }
                },
              ],
            },
          },
        },
        no_source: {
          id: 'no_source',
          on: {
            CODE_UPDATED: {
              actions: [
                assign({
                  sourceRawContent: (ctx, e) => e.code,
                }),
                forwardTo('codeCacheMachine'),
                forwardTo('confirmBeforeLeavingMachine'),
              ],
            },
            SAVE: [
              {
                cond: isLoggedIn,
                target: 'creating',
              },
              {
                actions: sendParent(
                  'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                ),
              },
            ],
          },
          invoke: [
            {
              src: cacheCodeChangesMachine,
              id: 'codeCacheMachine',
            },
            {
              src: confirmBeforeLeavingMachine,
              id: 'confirmBeforeLeavingMachine',
            },
          ],
          initial: 'checking_if_in_local_storage',
          states: {
            checking_if_in_local_storage: {
              always: {
                target: 'check_complete',
                actions: 'getLocalStorageCachedSource',
              },
            },
            check_complete: {},
          },
        },
        creating: {
          id: 'creating',
          initial: 'showingNameModal',
          states: {
            showingNameModal: {
              on: {
                CHOOSE_NAME: {
                  target: 'pendingSave',
                  actions: assign((context, event) => {
                    return {
                      desiredMachineName: event.name,
                    };
                  }),
                },
                CLOSE_NAME_CHOOSER_MODAL: [
                  {
                    target: '#with_source.source_loaded',
                    cond: (ctx) => Boolean(ctx.sourceID),
                  },
                  { target: '#no_source' },
                ],
              },
            },

            pendingSave: {
              tags: ['persisting'],
              invoke: {
                src: 'createSourceFile',
                onDone: {
                  target: '#with_source.source_loaded.user_owns_this_source',
                  actions: [
                    'assignCreateSourceFileToContext',
                    'updateURLWithMachineID',
                    send(
                      notifModel.events.BROADCAST(
                        'New file saved successfully!',
                        'success',
                      ),
                      {
                        to: (ctx) => {
                          return ctx.notifRef!;
                        },
                      },
                    ),
                  ],
                },
                onError: [
                  {
                    /**
                     * If the source had an ID, it means we've forking
                     * someone else's
                     */
                    cond: (ctx) => Boolean(ctx.sourceID),
                    target:
                      '#with_source.source_loaded.checking_if_user_owns_source',
                    actions: 'showSaveErrorToast',
                  },
                  {
                    target: '#no_source',
                    actions: 'showSaveErrorToast',
                  },
                ],
              },
            },
          },
        },
        updating: {
          tags: ['persisting'],
          id: 'updating',
          invoke: {
            src: 'updateSourceFile',
            onDone: {
              target: 'with_source.source_loaded.user_owns_this_source',
              actions: [
                assign(
                  (
                    context,
                    event: DoneInvokeEvent<UpdateSourceFileMutation>,
                  ) => {
                    return {
                      sourceID: event.data.updateSourceFile.id,
                      sourceProvider: 'registry',
                      sourceRegistryData: event.data.updateSourceFile,
                    };
                  },
                ),
                send(
                  notifModel.events.BROADCAST('Saved successfully', 'success'),
                  {
                    to: (ctx) => {
                      return ctx.notifRef!;
                    },
                  },
                ),
              ],
            },
            onError: {
              target: 'with_source.source_loaded',
              actions: send(
                notifModel.events.BROADCAST(
                  'An error occurred when saving.',
                  'error',
                ),
                {
                  to: (ctx) => {
                    return ctx.notifRef!;
                  },
                },
              ),
            },
          },
        },
      },
    },
    {
      actions: {
        addForkOfToDesiredName: assign((context, event) => {
          if (
            !context.desiredMachineName ||
            context.desiredMachineName?.endsWith('(forked)')
          ) {
            return {};
          }
          return {
            desiredMachineName: `${context.desiredMachineName} (forked)`,
          };
        }),
        showSaveErrorToast: send(
          notifModel.events.BROADCAST(
            'An error occurred when saving.',
            'error',
          ),
          {
            to: (ctx) => {
              return ctx.notifRef!;
            },
          },
        ),
        assignCreateSourceFileToContext: assign((context, _event: any) => {
          const event: DoneInvokeEvent<CreateSourceFileMutation> = _event;
          return {
            sourceID: event.data?.createSourceFile.id,
            sourceProvider: 'registry',
            sourceRegistryData: event.data.createSourceFile,
          };
        }),
        updateURLWithMachineID: (ctx) => {
          updateQueryParamsWithoutReload((queries) => {
            queries.delete('gist');
            if (ctx.sourceID) {
              queries.set('id', ctx.sourceID);
            }
          });
        },
        getLocalStorageCachedSource: assign((context, event) => {
          const result = localCache.getSourceRawContent(
            context.sourceID,
            context.sourceRegistryData?.updatedAt,
          );

          if (!result) {
            return {};
          }
          return {
            sourceRawContent: result,
          };
        }),
        parseQueries: assign((ctx) => {
          const queries = new URLSearchParams(window.location.search);
          if (queries.get('gist')) {
            return {
              sourceID: queries.get('gist'),
              sourceProvider: 'gist',
            };
          }
          if (queries.get('id')) {
            return {
              sourceID: queries.get('id'),
              sourceProvider: 'registry',
            };
          }
          return {};
        }),
        openNewWindowAtRoot: () => {
          window.open('/viz', '_blank', 'noopener');
        },
      },
      services: {
        createSourceFile: async (ctx, e) => {
          return gQuery(
            CreateSourceFileDocument,
            {
              text: ctx.sourceRawContent || '',
              name: ctx.desiredMachineName || '',
            },
            auth.session()?.access_token!,
          ).then((res) => {
            return res.data;
          });
        },
        updateSourceFile: async (ctx, e) => {
          if (e.type !== 'SAVE') return;
          return gQuery(
            UpdateSourceFileDocument,
            {
              id: ctx.sourceID,
              text: ctx.sourceRawContent,
            },
            auth.session()?.access_token!,
          ).then((res) => res.data);
        },
        loadSourceContent: (ctx) => async (send) => {
          switch (ctx.sourceProvider) {
            case 'gist':
              const response = await fetch(
                'https://api.github.com/gists/' + ctx.sourceID,
              );
              // Fetch doesn't treat 404's as errors by default
              if (response.status === 404) {
                return Promise.reject(new NotFoundError('Gist not found'));
              }
              const json = await response.json();

              const gistResponse = await fetch(
                json.files['machine.js'].raw_url,
              );
              const rawSource = await gistResponse.text();

              send({
                type: 'LOADED_FROM_GIST',
                rawSource,
              });
              break;
            case 'registry':
              const result = await gQuery(
                GetSourceFileDocument,
                {
                  id: ctx.sourceID,
                },
                auth.session()?.access_token!,
              );
              if (!result.data?.getSourceFile) {
                throw new NotFoundError('Source not found in Registry');
              }
              send({
                type: 'LOADED_FROM_REGISTRY',
                data: result.data,
              });
              break;
            default:
              throw new Error('It should be impossible to reach this.');
          }
        },
      },
    },
  );
};

export const getSourceActor = (state: StateFrom<typeof authMachine>) =>
  state.context.sourceRef!;

export const useSourceActor = (
  authService: ActorRefFrom<typeof authMachine>,
): [SourceMachineState, SourceMachineActorRef['send']] => {
  const sourceService = useSelector(authService, getSourceActor);

  return useActor(sourceService!);
};

const initialMachineCode = `
import { createMachine } from 'xstate';
`.trim();

export const getEditorDefaultValue = (state: SourceMachineState) => {
  return state.context.sourceRawContent || initialMachineCode;
};

export const getShouldImmediateUpdate = (state: SourceMachineState) => {
  return Boolean(state.context.sourceRawContent);
};
