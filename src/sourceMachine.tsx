import {
  ActorRefFrom,
  assign,
  createMachine,
  DoneInvokeEvent,
  send,
  spawn,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { ModelContextFrom } from 'xstate/lib/model.types';
import { localCache } from './localCache';
import { notifMachine } from './notificationMachine';
import { GetSourceFile } from './types';
import { gQuery, updateQueryParamsWithoutReload } from './utils';

type SourceProvider = 'gist' | 'registry';

const sourceModel = createModel({
  sourceID: null as string | null,
  sourceUpdatedAt: null as string | null,
  sourceProvider: null as SourceProvider | null,
  sourceRawContent: null as string | null,
  notifRef: null! as ActorRefFrom<typeof notifMachine>,
});

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }

  toString() {
    return this.message;
  }
}

export const sourceMachine = createMachine<typeof sourceModel>(
  {
    initial: 'checking_url',
    context: sourceModel.initialContext,
    entry: assign({ notifRef: () => spawn(notifMachine) }),
    states: {
      checking_url: {
        entry: 'parseQueries',
        always: [
          { target: 'with_source', cond: 'isSourceIDAvailable' },
          { target: 'no_source' },
        ],
      },
      with_source: {
        initial: 'loading_content',
        states: {
          loading_content: {
            invoke: {
              src: 'loadSourceContent',
              onDone: 'source_loaded',
              onError: 'source_error',
            },
          },
          source_loaded: {
            entry: ['saveSourceContent'],
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
          ctx: ModelContextFrom<typeof sourceModel>,
          e: DoneInvokeEvent<{ text: string; updatedAt?: string }>,
        ) => {
          return {
            sourceRawContent: e.data.text,
            sourceUpdatedAt: e.data.updatedAt || null,
          };
        },
      ) as any,
    },
    guards: {
      isSourceIDAvailable: (ctx) => !!ctx.sourceID,
    },
    services: {
      loadSourceContent: (
        ctx,
      ): Promise<{ text: string; updatedAt?: string }> => {
        switch (ctx.sourceProvider) {
          case 'gist':
            return fetch('https://api.github.com/gists/' + ctx.sourceID)
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
                    return {
                      text: await r.text(),
                    };
                  },
                );
              });
          case 'registry':
            return gQuery<GetSourceFile>(
              `query {getSourceFile(id: ${JSON.stringify(
                ctx.sourceID,
              )}) {id,text,updatedAt}}`,
            ).then((data) => {
              if (data.data?.getSourceFile) {
                return data.data.getSourceFile;
              }
              return Promise.reject(
                new NotFoundError('Source not found in Registry'),
              );
            });
          default:
            throw new Error('It should be impossible to reach this.');
        }
      },
    },
  },
);
