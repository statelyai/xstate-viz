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
  StateFrom,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import {
  GetLoggedInUserDataDocument,
  GetLoggedInUserDataQuery,
  LoggedInUserFragment,
} from './graphql/GetLoggedInUserData.generated';
import { notifMachine, notifModel } from './notificationMachine';
import {
  makeSourceMachine,
  SourceMachineActorRef,
  sourceModel,
} from './sourceMachine';
import { gQuery } from './utils';

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
      LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION: () => ({}),
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
    signOutUser: (ctx) => {
      return ctx.client.auth.signOut();
    },
  },
  actions: {
    signInUser: (ctx, e) =>
      ctx.client.auth.signIn(
        { provider: (e as any).provider },
        { redirectTo: window.location.href },
      ),
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
              process.env.NEXT_PUBLIC_SUPABASE_API_URL,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_API_KEY,
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
          LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION: '.choosing_provider',
        },
        initial: 'idle',
        states: {
          idle: {},
          choosing_provider: {
            on: {
              SIGN_IN: '#auth.signing_in',
              CANCEL_PROVIDER: {
                target: 'idle',
              },
            },
          },
        },
      },
      signed_in: {
        exit: [
          send(sourceModel.events.LOGGED_IN_USER_ID_UPDATED(null), {
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
                        event.data?.getLoggedInUser?.id,
                      );
                    },
                    {
                      to: (ctx) => ctx.sourceRef!,
                    },
                  ),
                ],
              },
              onError: {
                target: 'idle',
                actions: [
                  send(
                    notifModel.events.BROADCAST(
                      `Could not load your user's details. Some things may not work as expected. Reload the page to retry.`,
                      'error',
                    ),
                    {
                      to: (ctx) => ctx.notifRef,
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
        entry: 'signInUser',
        type: 'final',
        meta: {
          description: `
            Calling signInUser redirects us away from this
            page - this is modelled as a final state because
            the state machine is stopped and recreated when
            the user gets redirected back.
          `,
        },
      },
      signing_out: {
        invoke: {
          src: 'signOutUser',
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

export const getSupabaseClient = (state: StateFrom<typeof authMachine>) => {
  return state.context.client;
};
