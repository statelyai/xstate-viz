import { ActorRefFrom, assign, createMachine, send, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { notifMachine } from './notificationMachine';

const gistModel = createModel({
  gistID: null! as string,
  gistRawContent: null! as string,
  notifRef: null! as ActorRefFrom<typeof notifMachine>,
});

export const gistMachine = createMachine(
  {
    initial: 'checking_url',
    context: gistModel.initialContext,
    entry: assign({ notifRef: () => spawn(notifMachine) }),
    states: {
      checking_url: {
        entry: 'parseQueries',
        always: [
          { target: 'with_gist', cond: 'isGistIDAvailable' },
          { target: 'no_gist' },
        ],
      },
      with_gist: {
        initial: 'loading_content',
        states: {
          loading_content: {
            invoke: {
              src: 'loadGistContent',
              onDone: 'gist_loaded',
              onError: 'gist_error',
            },
          },
          gist_loaded: {
            entry: [
              'saveGistContent',
              send(
                (_, e: any) => ({
                  type: 'SUCCESS',
                  message: e.data.toString(),
                }),
                { to: (ctx: any) => ctx.notifRef },
              ),
            ],
          },
          gist_error: {
            entry: [
              send(
                (_, e: any) => ({
                  type: 'ERROR',
                  message: e.data.toString(),
                }),
                { to: (ctx: any) => ctx.notifRef },
              ),
            ],
          },
        },
      },
      no_gist: {
        type: 'final',
      },
    },
  },
  {
    actions: {
      // TODO: find why gistModel.assign has typing issues
      parseQueries: assign({
        gistID: new URLSearchParams(window.location.search).get('gist'),
      }),
      //   @ts-ignore
      saveGistContent: assign({ gistRawContent: (_, e: any) => e.data }),
      showMessage: send(
        (_, e: any) => ({
          type: e.messageType,
          message: e.data.toString(),
        }),
        { to: (ctx) => ctx.notifRef },
      ),
    },
    guards: {
      isGistIDAvailable: (ctx) => !!ctx.gistID,
    },
    services: {
      loadGistContent: (ctx) => {
        return fetch('https://api.github.com/gists/' + ctx.gistID)
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
      },
    },
  },
);
