import { createClient } from '@supabase/supabase-js';
import { NextRouter } from 'next/router';
import {
  ActorRefFrom,
  assign,
  DoneInvokeEvent,
  send,
  spawn,
  StateFrom,
} from 'xstate';
import { createModel } from 'xstate/lib/model';
import { LoggedInUser } from './apiTypes';
import { storage } from './localCache';
import { notifMachine, notifModel } from './notificationMachine';
import {
  makeSourceMachine,
  SourceMachineActorRef,
  sourceModel,
} from './sourceMachine';
import { SourceRegistryData } from './types';
import { callAPI, isSignedIn, once } from './utils';
import { analytics } from './analytics';

const trackApplicationLoad = once((_, event) => {
  analytics()?.identify(event.data.id);
  analytics()?.track('Opening XState Viz');
});

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
    loggedInUserData: null as LoggedInUser | null,
  },
  {
    events: {
      EXTERNAL_SIGN_IN: () => ({}),
      EXTERNAL_SIGN_OUT: () => ({}),
      SIGNED_IN: () => ({}),
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
  isEmbbeded: boolean;
}) => {
  return authModel.createMachine({
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
        if (isSignedIn()) {
          sendBack({ type: 'SIGNED_IN' });
        }
        ctx.client.auth.onAuthStateChange((event, session) => {
          // we only care about SIGNED_IN because signing out is "synchronous" from our perspective anyway
          // and is handled in response to user actions
          if (event === 'SIGNED_IN') {
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
          authModel.assign((ctx) => {
            return {
              sourceRef: spawn(
                makeSourceMachine({
                  auth: ctx.client.auth,
                  sourceRegistryData: params.sourceRegistryData,
                  router: params.router,
                  isEmbedded: params.isEmbbeded,
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
            cond: () => isSignedIn(),
            target: 'signed_in',
          },
          {
            target: 'signed_out',
          },
        ],
      },
      external_sign_in: {
        entry: [
          (_) => {
            if (typeof window === 'undefined') return;
            window.open(
              `/registry/login?redirectTo=${encodeURIComponent(
                window.location.pathname,
              )}`,
              '_self',
            );
          },
        ],
      },
      external_sign_out: {
        tags: ['authorized'],
        entry: [
          (_) => {
            if (typeof window === 'undefined') return;
            window.open(
              `/registry/logout?redirectTo=${encodeURIComponent(
                window.location.pathname,
              )}`,
              '_self',
            );
          },
        ],
      },
      signed_out: {
        on: {
          EXTERNAL_SIGN_IN: 'external_sign_in',
        },
        initial: 'idle',
        states: {
          idle: {},
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
          EXTERNAL_SIGN_OUT: 'external_sign_out',
        },
        initial: 'fetchingUser',
        states: {
          fetchingUser: {
            invoke: {
              src: (_): Promise<LoggedInUser> =>
                callAPI<LoggedInUser>({
                  endpoint: 'get-user',
                }).then((res) => res.data),
              onDone: {
                target: 'idle',
                actions: [
                  assign((_, event: DoneInvokeEvent<LoggedInUser>) => {
                    return {
                      loggedInUserData: event.data,
                    };
                  }),
                  send(
                    (_, event: DoneInvokeEvent<LoggedInUser>) => {
                      return sourceModel.events.LOGGED_IN_USER_ID_UPDATED(
                        event.data.id,
                      );
                    },
                    {
                      to: (ctx) => ctx.sourceRef!,
                    },
                  ),
                  trackApplicationLoad,
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
                  trackApplicationLoad,
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
  });
};

export const getSupabaseClient = (state: AuthMachineState) => {
  return state.context.client;
};
