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
import { notifMachine } from './notificationMachine';
import { gQuery, updateQueryParamsWithoutReload } from './utils';

type SourceProvider = 'gist' | 'registry';

const sourceModel = createModel(
  {
    sourceID: null as string | null,
    sourceUpdatedAt: null as string | null,
    sourceProvider: null as SourceProvider | null,
    sourceRawContent: null as string | null,
    sourceOwnerId: null as string | null,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
  },
  {
    events: {
      SAVE: (rawSource: string) => ({
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
    },
  },
);

export type SourceMachineActorRef = ActorRefFrom<
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

export const makeSourceMachine = (
  auth: SupabaseAuthClient,
  getLoggedInUserId: () => string | undefined,
) => {
  const isLoggedIn = () => {
    return Boolean(auth.session());
  };

  return createMachine<typeof sourceModel>(
    {
      initial: 'checking_url',
      context: sourceModel.initialContext,
      entry: assign({ notifRef: () => spawn(notifMachine) }),
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
                        sourceOwnerId: event.data.getSourceFile?.id,
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
                SAVE: [
                  {
                    cond: isLoggedIn,
                    target: '#updating',
                  },
                  {
                    actions: sendParent('LOGGED_OUT_USER_ATTEMPTED_SAVE'),
                  },
                ],
                CODE_UPDATED: {
                  actions: [
                    forwardTo('codeCacheMachine'),
                    forwardTo('confirmBeforeLeavingMachine'),
                  ],
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
                      cond: (ctx, event) => {
                        const ownerId = ctx.sourceOwnerId;
                        const loggedInUserId = getLoggedInUserId();

                        if (!ownerId || !loggedInUserId) return false;

                        return ownerId === loggedInUserId;
                      },
                      target: 'user_owns_this_source',
                    },
                    {
                      target: 'user_does_not_own_this_source',
                    },
                  ],
                },
                user_owns_this_source: {},
                user_does_not_own_this_source: {},
              },
            },
            source_error: {
              entry: [
                send(
                  (_, e: any) => ({
                    type: 'BROADCAST',
                    status: 'error',
                    message: e.data.toString(),
                  }),
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
          invoke: {
            src: 'createSourceFile',
            // TODO - handle error
            onDone: {
              target: 'with_source.source_loaded.user_owns_this_source',
              actions: assign(
                (context, event: DoneInvokeEvent<CreateSourceFileMutation>) => {
                  return {
                    sourceID: event.data.createSourceFile.id,
                    sourceProvider: 'registry',
                    sourceUpdatedAt: event.data.createSourceFile.updatedAt,
                  };
                },
              ),
            },
          },
        },
        updating: {
          id: 'updating',
          invoke: {
            src: 'updateSourceFile',
            // TODO - handle error
            onDone: {
              target: 'with_source.source_loaded.user_owns_this_source',
              actions: assign(
                (context, event: DoneInvokeEvent<UpdateSourceFileMutation>) => {
                  return {
                    sourceID: event.data.updateSourceFile.id,
                    sourceProvider: 'registry',
                    sourceUpdatedAt: event.data.updateSourceFile.updatedAt,
                  };
                },
              ),
            },
          },
        },
      },
    },
    {
      actions: {
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
          if (e.type !== 'SAVE') return;
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
              await fetch('https://api.github.com/gists/' + ctx.sourceID)
                .then((resp) => {
                  //   fetch doesn't treat 404 as errors by default
                  if (resp.status === 404) {
                    return Promise.reject(new NotFoundError('Gist not found'));
                  }
                  return resp.json();
                })
                .then((data) => {
                  return fetch(data.files['machine.js'].raw_url).then(
                    async (r) => {
                      const rawSource = await r.text();
                      send({
                        type: 'LOADED_FROM_GIST',
                        rawSource,
                      });
                    },
                  );
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
