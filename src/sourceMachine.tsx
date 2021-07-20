import { ActorRefFrom, assign, createMachine, send, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { notifMachine } from './notificationMachine';
import { gQuery, updateQueryParamsWithoutReload } from './utils';

type SourceProvider = 'gist' | 'registry';

const sourceModel = createModel({
  sourceID: null as string | null,
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
        type: 'final',
      },
    },
  },
  {
    actions: {
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
      saveSourceContent: assign({
        sourceRawContent: (_, e) => {
          if (!('data' in e)) {
            throw new Error('`data` not available on the event');
          }

          return (e as any).data;
        },
      }),
    },
    guards: {
      isSourceIDAvailable: (ctx) => !!ctx.sourceID,
    },
    services: {
      loadSourceContent: (ctx) => {
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
                return fetch(data.files['machine.js'].raw_url).then((r) =>
                  r.text(),
                );
              });
          case 'registry':
            return gQuery(
              `query {getSourceFile(id: ${JSON.stringify(
                ctx.sourceID,
              )}) {id,text}}`,
            ).then((data) => {
              if (data.data.getSourceFile) {
                return data.data.getSourceFile.text;
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
