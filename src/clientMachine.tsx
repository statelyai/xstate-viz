import {
  createClient,
  Provider,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { assign, MachineOptions } from 'xstate';
import { createMachine } from 'xstate';
import { createModel, ModelEventsFrom } from 'xstate/lib/model';
import { gQuery } from './utils';

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
      SAVE: (rawSource: string) => ({
        rawSource,
      }),
      UPDATE: (id: string, rawSource: string) => ({
        id,
        rawSource,
      }),
    },
  },
);

const clientOptions: Partial<
  MachineOptions<
    typeof clientModel['initialContext'],
    ModelEventsFrom<typeof clientModel>
  >
> = {
  actions: {
    saveCreatedMachine: assign({
      createdMachine: (_, e) => (e as any).data,
    }),
    updateURLWithMachineID: (_, e: any) => {
      const newURL = new URL(window.location.href);
      newURL.searchParams.delete('gist');
      newURL.searchParams.set('id', e.data.id);
      window.history.pushState({ path: newURL.href }, '', newURL.href);
    },
  },
  services: {
    saveMachines: (ctx, e: any) =>
      gQuery(
        `mutation {createSourceFile(text: ${JSON.stringify(
          e.rawSource,
        )}) {id}}`,
        ctx.client.auth.session()?.access_token!,
      ).then((data) => data.data.createSourceFile),
    updateMachines: (ctx, e: any) => {
      return gQuery(
        `mutation {updateSourceFile(id: ${JSON.stringify(
          e.id,
        )}, text: ${JSON.stringify(e.rawSource)}) {id}}`,
        ctx.client.auth.session()?.access_token!,
      ).then((data) => data.data.updateSourceFile);
    },
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

export const clientMachine = createMachine<typeof clientModel>(
  {
    id: 'client',
    initial: 'initializing',
    context: clientModel.initialContext,
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
          assign({
            client: createClient(
              process.env.REACT_APP_SUPABASE_API_URL,
              process.env.REACT_APP_SUPABASE_ANON_API_KEY,
            ),
          }),
        ],
        always: 'signed_out',
      },
      signed_out: {
        on: {
          SAVE: {
            target: '.choosing_provider',
          },
          UPDATE: {
            target: '.choosing_provider',
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
              },
            },
          },
        },
      },
      signed_in: {
        on: {
          SIGN_OUT: 'signing_out',
          SAVE: 'saving',
          UPDATE: 'updating',
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
            actions: ['saveCreatedMachine', 'updateURLWithMachineID'],
          },
          onError: {
            target: 'signed_in',
            actions: ['showError'],
          },
        },
      },
      updating: {
        invoke: {
          src: 'updateMachines',
          onDone: {
            target: 'signed_in',
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
