import { Provider, Session } from '@supabase/supabase-js';
import { assign } from 'xstate';
import { createMachine, send } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { client } from './APIClient';

const clientModel = createModel(
  {
    session: null! as Session,
    createdMachine: null! as any,
  },
  {
    events: {
      LOGIN: (provider: Provider) => ({ provider }),
      LOGOUT: () => ({}),
      PERSIST_MACHINE: (definition: string) => ({ definition }),
      SAVE_MACHINE: (definition: string) => ({ definition }),
      UPDATE_MACHINE: (definition: string) => ({ definition }),
    },
  },
);

export const clientMachine = createMachine<typeof clientModel>({
  id: 'clientMachine',
  initial: 'checking_auth',
  context: clientModel.initialContext,
  states: {
    checking_auth: {
      invoke: {
        src: () =>
          new Promise((resolve, reject) => {
            const session = client.auth.session();
            if (session) {
              resolve(session);
            } else {
              reject();
            }
          }),
        onDone: {
          target: 'signedin',
          actions: [
            assign({
              session: (_, e) => (e as any).data,
            }),
          ],
        },
        onError: {
          target: 'signedout',
        },
      },
    },
    authenticating: {
      invoke: {
        src: (_, e) => client.auth.signIn({ provider: (e as any).provider }),
        onDone: 'signedin',
        onError: 'signedout',
      },
    },
    signedin: {
      on: {
        PERSIST_MACHINE: 'persisting',
      },
    },
    signedout: {
      on: {
        LOGIN: 'authenticating',
        PERSIST_MACHINE: {
          actions: send('LOGIN'),
        },
      },
    },
    persisting: {
      invoke: {
        src: (_, e) =>
          fetch(
            'https://registry-omega.vercel.app/api/graphql?query=' +
              encodeURIComponent((e as any).definition),
          ),
        onDone: {
          target: 'signedin',
          actions: [
            assign({
              createdMachine: (_, e) => (e as any).definition,
            }),
          ],
        },
        onError: {
          target: 'signedin', // TODO: handle errors with notification machine
        },
      },
    },
  },
});
