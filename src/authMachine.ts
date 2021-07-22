import {
  createClient,
  Provider,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import {
  ActorRefFrom,
  assign,
  createMachine,
  EventFrom,
  MachineOptions,
  send,
  spawn,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { cacheCodeChangesMachine } from './cacheCodeChangesMachine';
import { notifMachine } from './notificationMachine';
import { makeSourceMachine, SourceMachineActorRef } from './sourceMachine';
import { updateQueryParamsWithoutReload } from './utils';

const authModel = createModel(
  {
    client: null! as SupabaseClient,
    createdMachine: null! as any,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
    sourceRef: null as SourceMachineActorRef | null,
  },
  {
    events: {
      SIGNED_OUT: () => ({}),
      SIGNED_IN: (session: Session) => ({ session }),
      SIGN_IN: (provider: Provider) => ({ provider }),
      SIGN_OUT: () => ({}),
      CHOOSE_PROVIDER: () => ({}),
      CANCEL_PROVIDER: () => ({}),
      LOGGED_OUT_USER_ATTEMPTED_SAVE: () => ({}),
    },
  },
);

const authOptions: Partial<
  MachineOptions<
    typeof authModel['initialContext'],
    EventFrom<typeof authModel>
  >
> = {
  actions: {
    saveCreatedMachine: assign({
      createdMachine: (_, e) => (e as any).data,
    }),
    updateURLWithMachineID: (_, e: any) => {
      updateQueryParamsWithoutReload((queries) => {
        queries.delete('gist');
        queries.set('id', e.data.id);
      });
    },
  },
  services: {
    checkUserSession: (ctx) =>
      new Promise((resolve, reject) => {
        const session = ctx.client.auth.session();
        if (session) {
          resolve(session);
        } else {
          reject();
        }
      }),
    signinUser: (ctx, e) =>
      ctx.client.auth.signIn(
        { provider: (e as any).provider },
        { redirectTo: window.location.href },
      ),
    signoutUser: (ctx) => {
      return ctx.client.auth.signOut();
    },
  },
};

export const clientMachine = createMachine<typeof authModel>(
  {
    id: 'client',
    initial: 'initializing',
    context: authModel.initialContext,
    entry: assign({
      notifRef: () => spawn(notifMachine),
    }),
    invoke: {
      src: (ctx) => (sendBack) => {
        ctx.client.auth.onAuthStateChange((state, session) => {
          if (session) {
            sendBack({ type: 'SIGNED_IN', session });
          } else {
            sendBack('SIGNED_OUT');
          }
        });
      },
    },
    on: {
      SIGNED_OUT: { target: 'signed_out', internal: true },
      SIGNED_IN: {
        target: 'signed_in',
        internal: true,
      },
    },
    states: {
      initializing: {
        entry: [
          assign((ctx) => {
            const client = createClient(
              process.env.REACT_APP_SUPABASE_API_URL,
              process.env.REACT_APP_SUPABASE_ANON_API_KEY,
            );

            return {
              client,
              sourceRef: spawn(makeSourceMachine(client.auth)),
            };
          }),
        ],
        always: 'checking_if_signed_in',
      },
      checking_if_signed_in: {
        always: [
          {
            cond: (ctx) => Boolean(ctx.client.auth.session()),
            target: 'signed_in',
          },
          {
            target: 'signed_out',
          },
        ],
      },
      signed_out: {
        on: {
          CHOOSE_PROVIDER: '.choosing_provider',
          LOGGED_OUT_USER_ATTEMPTED_SAVE: '.choosing_provider',
        },
        initial: 'idle',
        states: {
          idle: {},
          choosing_provider: {
            on: {
              SIGN_IN: '#client.signing_in',
              CANCEL_PROVIDER: {
                target: 'idle',
              },
            },
          },
        },
      },
      signed_in: {
        tags: ['authorized'],
        on: {
          SIGN_OUT: 'signing_out',
        },
      },
      signing_in: {
        invoke: {
          src: 'signinUser',
          // No need, eventual consistency from the auth listener
          onDone: {
            target: 'signed_in',
          },
          onError: {
            target: 'signed_out',
            actions: [
              send(
                (_, e) => ({
                  type: 'BROADCAST',
                  status: 'error',
                  message: e.data,
                }),
                { to: (ctx) => ctx.notifRef },
              ),
            ],
          },
        },
      },
      signing_out: {
        invoke: {
          src: 'signoutUser',
          onDone: {
            target: 'signed_out',
          },
          onError: {
            target: 'signed_in',
            actions: [
              send(
                (_, e) => ({
                  type: 'BROADCAST',
                  status: 'error',
                  message: e.data,
                }),
                { to: (ctx) => ctx.notifRef },
              ),
            ],
          },
        },
      },
    },
  },
  authOptions,
);
