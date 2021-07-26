import { SupabaseAuthClient } from '@supabase/supabase-js/dist/main/lib/SupabaseAuthClient';
import {
  ActorRefFrom,
  assign,
  ContextFrom,
  createMachine,
  DoneInvokeEvent,
  forwardTo,
  send,
  sendParent,
  spawn,
  StateFrom,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
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
import {
  UpdateSourceFileDocument,
  UpdateSourceFileMutation,
} from './graphql/UpdateSourceFile.generated';
import { localCache } from './localCache';
import { notifMachine, notifModel } from './notificationMachine';
import { gQuery, updateQueryParamsWithoutReload } from './utils';

type SourceProvider = 'gist' | 'registry';

export const sourceModel = createModel(
  {
    sourceID: null as string | null,
    sourceUpdatedAt: null as string | null,
    sourceProvider: null as SourceProvider | null,
    sourceRawContent: null as string | null,
    sourceOwnerId: null as string | null,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
    loggedInUserId: null! as string | null,
  },
  {
    events: {
      SAVE: (rawSource: string) => ({
        rawSource,
      }),
      CREATE_NEW: (rawSource: string) => ({
        rawSource,
      }),
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
    },
  },
);

export type SourceMachineActorRef = ActorRefFrom<
  ReturnType<typeof makeSourceMachine>
>;

export type SourceMachineState = StateFrom<
  ReturnType<typeof makeSourceMachine>
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
          initial: 'loading_content',
          on: {
            CREATE_NEW: [
              {
                target: '#forking',
                cond: isLoggedIn,
              },
              {
                actions: sendParent('LOGGED_OUT_USER_ATTEMPTED_SAVE'),
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
                        sourceUpdatedAt: event.data.getSourceFile?.updatedAt,
                        sourceOwnerId: event.data.getSourceFile?.owner?.id,
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
                        const ownerId = ctx.sourceOwnerId;

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
                        actions: sendParent('LOGGED_OUT_USER_ATTEMPTED_SAVE'),
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
                      },
                      {
                        actions: sendParent('LOGGED_OUT_USER_ATTEMPTED_SAVE'),
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
                    notifModel.events.BROADCAST(e.data.toString, 'error'),
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
          on: {
            CODE_UPDATED: {
              actions: [
                forwardTo('codeCacheMachine'),
                forwardTo('confirmBeforeLeavingMachine'),
              ],
            },
            SAVE: [
              {
                cond: isLoggedIn,
                target: 'creating',
              },
              { actions: sendParent('LOGGED_OUT_USER_ATTEMPTED_SAVE') },
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
          tags: ['persisting'],
          invoke: {
            src: 'createSourceFile',
            onDone: {
              target: 'with_source.source_loaded.user_owns_this_source',
              actions: [
                'assignCreateSourceFileToContext',
                'updateURLWithMachineID',
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
              target: 'no_source',
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
        forking: {
          tags: ['forking'],
          id: 'forking',
          invoke: {
            src: 'createSourceFile',
            onDone: {
              target: 'with_source.source_loaded.user_owns_this_source',
              actions: [
                'assignCreateSourceFileToContext',
                'updateURLWithMachineID',
                send(
                  notifModel.events.BROADCAST('Forked successfully', 'success'),
                  {
                    to: (ctx) => {
                      return ctx.notifRef!;
                    },
                  },
                ),
              ],
            },
            onError: {
              target: 'with_source',
              actions: send(
                notifModel.events.BROADCAST(
                  'An error occurred when forking',
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
                      sourceUpdatedAt: event.data.updateSourceFile.updatedAt,
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
        assignCreateSourceFileToContext: assign((context, _event: any) => {
          const event: DoneInvokeEvent<CreateSourceFileMutation> = _event;
          return {
            sourceID: event.data.createSourceFile.id,
            sourceProvider: 'registry',
            sourceUpdatedAt: event.data.createSourceFile.updatedAt,
            sourceOwnerId: event.data.createSourceFile.ownerId,
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
            context.sourceUpdatedAt,
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
        saveSourceContent: assign(
          (
            ctx: ContextFrom<typeof sourceModel>,
            e: DoneInvokeEvent<{ text: string; updatedAt?: string }>,
          ) => {
            return {
              sourceRawContent: e.data.text,
              sourceUpdatedAt: e.data.updatedAt || null,
            };
          },
        ) as any,
      },
      services: {
        createSourceFile: async (ctx, e) => {
          if (e.type !== 'SAVE' && e.type !== 'CREATE_NEW') return;
          return gQuery(
            CreateSourceFileDocument,
            {
              text: e.rawSource,
            },
            auth.session()?.access_token!,
          ).then((res) => res.data);
        },
        updateSourceFile: async (ctx, e) => {
          if (e.type !== 'SAVE') return;
          return gQuery(
            UpdateSourceFileDocument,
            {
              id: ctx.sourceID,
              text: e.rawSource,
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
              const result = await gQuery(GetSourceFileDocument, {
                id: ctx.sourceID,
              });
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
