import {
  createClient,
  Provider,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { assign, MachineOptions } from 'xstate';
import { createMachine } from 'xstate';
import { createModel, ModelEventsFrom } from 'xstate/lib/model';

const clientModel = createModel(
  {
    client: null! as SupabaseClient,
    session: null! as Session,
    createdMachine: null! as any,
  },
  {
    events: {
      SIGNED_OUT: () => ({}),
      SIGNED_IN: (session: Session) => ({ session }),
      SIGN_IN: (provider: Provider) => ({ provider }),
      SIGN_OUT: () => ({}),
      CHOOSE_PROVIDER: () => ({}),
      CANCEL_PROVIDER: () => ({}),
      SAVE: (rawJSSource: string) => ({ rawJSSource }),
    },
  },
);

const clientOptions: Partial<
  MachineOptions<
    typeof clientModel['initialContext'],
    ModelEventsFrom<typeof clientModel>
  >
> = {
  guards: {
    hasSaveSignal: () => !!localStorage.getItem('save'),
  },
  actions: {
    saveCreatedMachine: assign({
      createdMachine: (_, e) => (e as any).data,
    }),
    setSaveSignal: () => {
      localStorage.setItem('save', '1');
    },
    removeSaveSignal: () => {
      localStorage.removeItem('save');
    },
  },
  services: {
    saveMachines: () => Promise.resolve(),
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
      ctx.client.auth.signIn({ provider: (e as any).provider }),
    signoutUser: (ctx) => {
      console.log('signoutuser service');
      return ctx.client.auth.signOut();
    },
  },
};

export const clientMachine = createMachine<typeof clientModel>(
  {
    id: 'client',
    initial: 'initializing',
    context: clientModel.initialContext,
    invoke: {
      src: (ctx) => (sendBack) => {
        ctx.client.auth.onAuthStateChange((_, session) => {
          console.log({ session });
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
          assign({
            client: createClient(
              process.env.REACT_APP_SUPABASE_API_URL,
              process.env.REACT_APP_SUPABASE_ANON_API_KEY,
            ),
          }),
        ],
        always: 'checking_for_save',
      },
      checking_for_save: {
        always: [
          {
            target: 'saving',
            cond: 'hasSaveSignal',
          },
          { target: 'signed_out' },
        ],
      },
      signed_out: {
        on: {
          SAVE: {
            target: '.choosing_provider',
            actions: ['setSaveSignal'],
          },
          CHOOSE_PROVIDER: '.choosing_provider',
        },
        initial: 'idle',
        states: {
          idle: {},
          choosing_provider: {
            on: {
              SIGN_IN: '#client.signing_in',
              CANCEL_PROVIDER: {
                target: 'idle',
                actions: ['removeSaveSignal'],
              },
            },
          },
        },
      },
      signed_in: {
        on: {
          SIGN_OUT: 'signing_out',
          SAVE: 'saving',
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
            actions: ['showError'],
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
            actions: ['showError'],
          },
        },
      },
      saving: {
        invoke: {
          src: 'saveMachines',
          onDone: {
            target: 'signed_in',
            actions: ['saveCreatedMachine', 'removeSaveSignal'],
          },
          onError: {
            target: 'signed_in',
            actions: ['showError'],
          },
        },
      },
    },
  },
  clientOptions,
);
