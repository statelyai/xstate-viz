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
      SAVE: (rawSource: string) => ({ rawSource }),
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
    updateURLWithMachineID: (_, e: any) => {
      // const queries = new URLSearchParams(window.location.search);
      // queries.delete('gist');
      // queries.set('id', e.data.id);
      const newURL = new URL(window.location.href);
      newURL.searchParams.delete('gist');
      console.log(e);
      newURL.searchParams.set('id', e.data.data.createSourceFile.id);
      window.history.pushState({ path: newURL.href }, '', newURL.href);
    },
  },
  services: {
    saveMachines: (ctx, e: any) =>
      fetch(process.env.REACT_APP_GRAPHQL_API_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + ctx.client.auth.session()?.access_token,
        },
        body: JSON.stringify({
          query: `mutation {
  createSourceFile(text: ${JSON.stringify(e.rawSource)}) {
    id
  }
}`,
        }),
      }).then((resp) => resp.json()),
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
          console.log(state, { session });
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
      // checking_for_save: {
      //   always: [
      //     {
      //       target: 'saving',
      //       cond: 'hasSaveSignal',
      //     },
      //     { target: 'signed_out' },
      //   ],
      // },
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
            actions: [
              'saveCreatedMachine',
              'removeSaveSignal',
              'updateURLWithMachineID',
            ],
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
