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
  DoneInvokeEvent,
  EventFrom,
  MachineOptions,
  send,
  spawn,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { cacheCodeChangesMachine } from './cacheCodeChangesMachine';
import {
  GetLoggedInUserDataDocument,
  GetLoggedInUserDataQuery,
  LoggedInUserFragment,
} from './graphql/GetLoggedInUserData.generated';
import { notifMachine } from './notificationMachine';
import {
  makeSourceMachine,
  SourceMachineActorRef,
  sourceModel,
} from './sourceMachine';
import { gQuery, updateQueryParamsWithoutReload } from './utils';

const authModel = createModel(
  {
    client: null! as SupabaseClient,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
    sourceRef: null as SourceMachineActorRef | null,
    loggedInUserData: null as null | LoggedInUserFragment,
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
  services: {
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

export const authMachine = createMachine<typeof authModel>(
  {
    id: 'auth',
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
        exit: [
          send((ctx) => sourceModel.events.LOGGED_IN_USER_ID_UPDATED(null), {
            to: (ctx) => ctx.sourceRef!,
          }),
        ],
        tags: ['authorized'],
        on: {
          SIGN_OUT: 'signing_out',
        },
        initial: 'fetchingUser',
        states: {
          fetchingUser: {
            invoke: {
              src: async (
                ctx,
              ): Promise<GetLoggedInUserDataQuery | undefined> => {
                return gQuery(
                  GetLoggedInUserDataDocument,
                  {},
                  ctx.client.auth.session()?.access_token,
                ).then((res) => res.data);
              },
              onDone: {
                target: 'idle',
                actions: [
                  assign(
                    (
                      context,
                      event: DoneInvokeEvent<GetLoggedInUserDataQuery>,
                    ) => {
                      return {
                        loggedInUserData: event.data?.getLoggedInUser,
                      };
                    },
                  ),
                  send(
                    (ctx, event: DoneInvokeEvent<GetLoggedInUserDataQuery>) => {
                      return sourceModel.events.LOGGED_IN_USER_ID_UPDATED(
                        event.data?.getLoggedInUser?.id || null,
                      );
                    },
                    {
                      to: (ctx) => ctx.sourceRef!,
                    },
                  ),
                ],
              },
            },
          },
          idle: {},
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
