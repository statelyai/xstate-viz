import {
  createClient,
  Provider,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { ActorRefFrom, assign, EventFrom, MachineOptions } from 'xstate';
import { spawn } from 'xstate';
import { send } from 'xstate';
import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { confirmBeforeLeavingService } from './confirmLeavingService';
import { notifMachine, notifModel } from './notificationMachine';
import { gQuery, updateQueryParamsWithoutReload } from './utils';

const clientModel = createModel(
  {
    client: null! as SupabaseClient,
    createdMachine: null! as any,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
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
      CODE_UPDATED: () => ({}),
    },
  },
);

const clientOptions: Partial<
  MachineOptions<
    typeof clientModel['initialContext'],
    EventFrom<typeof clientModel>
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
    saveMachines: async (ctx, e) => {
      if (e.type !== 'SAVE') return;
      return gQuery(
        `mutation {createSourceFile(text: ${JSON.stringify(
          e.rawSource,
        )}) {id}}`,
        ctx.client.auth.session()?.access_token!,
      ).then((data) => data.data.createSourceFile);
    },
    updateMachines: async (ctx, e) => {
      if (e.type !== 'UPDATE') return;
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
        tags: ['authorized'],
        on: {
          SIGN_OUT: 'signing_out',
          SAVE: 'saving',
          UPDATE: 'updating',
        },
        initial: 'noCodeChanges',
        states: {
          noCodeChanges: {
            on: {
              CODE_UPDATED: 'hasCodeChanges',
            },
          },
          hasCodeChanges: {
            invoke: {
              src: confirmBeforeLeavingService,
            },
          },
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
      saving: {
        tags: ['persisting', 'authorized'],
        invoke: {
          src: 'saveMachines',
          onDone: {
            target: 'signed_in',
            actions: [
              'saveCreatedMachine',
              'updateURLWithMachineID',
              send(notifModel.events.BROADCAST('Machine saved!', 'success'), {
                to: (ctx) => ctx.notifRef,
              }),
            ],
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
      updating: {
        tags: ['persisting', 'authorized'],
        invoke: {
          src: 'updateMachines',
          onDone: {
            target: 'signed_in',
            actions: [
              send(notifModel.events.BROADCAST('Machine saved!', 'success'), {
                to: (ctx) => ctx.notifRef,
              }),
            ],
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
  clientOptions,
);
