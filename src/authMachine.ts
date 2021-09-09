import { createClient, Provider, Session } from '@supabase/supabase-js';
import {
  ActorRefFrom,
  assign,
  createMachine,
  DoneInvokeEvent,
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
import { storage } from './localCache';
import { gQuery } from './utils';
import { SourceRegistryData } from './types';
import { NextRouter } from 'next/router';

const authModel = createModel(
  {
    client: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_API_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_API_KEY,
      {
        localStorage: storage,
      },
    ),
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
    sourceRef: null as SourceMachineActorRef | null,
    loggedInUserData: null as LoggedInUserFragment | null,
  },
  {
    events: {
      SIGNED_IN: () => ({}),
      SIGN_IN: (provider: Provider) => ({ provider }),
      SIGN_OUT: () => ({}),
      CHOOSE_PROVIDER: () => ({}),
      CANCEL_PROVIDER: () => ({}),
      LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION: () => ({}),
    },
  },
);

export type AuthMachine = ReturnType<typeof createAuthMachine>;

export type AuthMachineState = StateFrom<AuthMachine>;

export const createAuthMachine = (params: {
  sourceRegistryData: SourceRegistryData | null;
  router: NextRouter;
}) =>
  createMachine<typeof authModel>(
    {
      preserveActionOrder: true,
      id: 'auth',
      initial: 'initializing',
      context: authModel.initialContext,
      entry: assign({
        notifRef: () => spawn(notifMachine),
      }),
      invoke: {
        // this wouldn't be needed if only internal Supabase's `getSessionFromUrl` (happening after redirect) would be synchronous
        src: (ctx) => (sendBack) => {
          if (ctx.client.auth.session()) {
            sendBack({ type: 'SIGNED_IN' });
          }
          ctx.client.auth.onAuthStateChange((state) => {
            // we only care about SIGNED_IN because signing out is "synchronous" from our perspective anyway
            // and is handled in response to user actions
            if (state === 'SIGNED_IN') {
              sendBack({ type: 'SIGNED_IN' });
            }
          });
        },
      },
      on: {
        SIGNED_IN: {
          target: 'signed_in',
          internal: true,
        },
      },
      states: {
        initializing: {
          entry: [
            assign((ctx) => {
              return {
                sourceRef: spawn(
                  makeSourceMachine({
                    auth: ctx.client.auth,
                    sourceRegistryData: params.sourceRegistryData,
                    router: params.router,
                  }),
                ),
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
            SIGN_OUT: {
              target: 'signed_out',
              actions: 'signOutUser',
            },
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
                      (
                        ctx,
                        event: DoneInvokeEvent<GetLoggedInUserDataQuery>,
                      ) => {
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
      },
    },
    {
      actions: {
        signInUser: (ctx, e) => {
          ctx.client.auth.signIn(
            { provider: (e as any).provider },
            { redirectTo: window.location.href },
          );
        },
        signOutUser: (ctx) => {
          // This synchronously removes locally stored token and asynchronously revokes all (😢) refresh tokens.
          // Retrying this isn't possible using the public API of the auth client because the access token is no longer available then.
          // So we just ignore a possible error here as it's not really actionable.
          // However, the token won't be available on this machine anymore so, in a sense, the signing out is always successful.
          ctx.client.auth.signOut().catch(() => {});
        },
      },
    },
  );

export const getSupabaseClient = (state: AuthMachineState) => {
  return state.context.client;
};
