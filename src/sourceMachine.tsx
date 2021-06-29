import { ActorRefFrom, assign, createMachine, send, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { notifMachine } from './notificationMachine';
import { gQuery } from './utils';

type SourceProvider = 'gist' | 'registry';

const sourceModel = createModel({
  sourceID: null,
  sourceProvider: null! as SourceProvider,
  sourceRawContent: null! as string,
  notifRef: null! as ActorRefFrom<typeof notifMachine>,
});

export const sourceMachine = createMachine(
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
            entry: [
              'saveSourceContent',
              send(
                (ctx) => ({
                  type: 'BROADCAST',
                  status: 'success',
                  message: `Source loaded successfully from ${ctx.sourceProvider}`,
                }),
                { to: (ctx: any) => ctx.notifRef },
              ),
            ],
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
      // TODO: find why sourceModel.assign has typing issues
      // @ts-ignore
      parseQueries: assign(() => {
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
      //   @ts-ignore
      saveSourceContent: assign({ sourceRawContent: (_, e: any) => e.data }),
    },
    guards: {
      isSourceIDAvailable: (ctx) => !!ctx.sourceID,
    },
    services: {
      loadSourceContent: (ctx) => {
        let sourceFetcher: () => Promise<any>;
        switch (ctx.sourceProvider) {
          case 'gist':
            sourceFetcher = () =>
              fetch('https://api.github.com/gists/' + ctx.sourceID)
                .then((resp) => {
                  //   fetch doesn't treat 404 as errors by default
                  if (resp.status === 404) {
                    return Promise.reject(Error('Gist not found'));
                  }
                  return resp.json();
                })
                .then((data) => {
                  return fetch(data.files['machine.js'].raw_url).then((r) =>
                    r.text(),
                  );
                });
            break;
          case 'registry':
            sourceFetcher = () =>
              gQuery(
                `query {getSourceFile(id: ${JSON.stringify(
                  ctx.sourceID,
                )}) {id,text}}`,
              ).then((data) => {
                if (data.data.getSourceFile) {
                  return data.data.getSourceFile.text;
                }
                return Promise.reject(Error('Source not found in Registry'));
              });
            break;
        }

        return sourceFetcher();
      },
    },
  },
);
