/// <reference types="cypress" />

import '@testing-library/cypress/add-commands';
import 'cypress-localstorage-commands';
import 'cypress-real-events/support';
import { inspect, Inspector } from '@xstate/inspect';
import { interpret, InterpreterFrom, StateMachine } from 'xstate';
import { state } from './state';
import { Mutation, Query } from '../../src/graphql/schemaTypes.generated';

const setMockAuthToken = () => {
  cy.setLocalStorage(
    'supabase.auth.token',
    JSON.stringify({
      currentSession: {
        access_token: 'token',
        user: {
          app_metadata: { provider: 'github' },
          user_metadata: {
            avatar_url: 'https://avatars.githubusercontent.com/u/28293365',
            full_name: 'Matt Pocock',
          },
        },
      },
    }),
  );
};

const interceptGraphQL = (data: DeepPartial<Mutation & Query>) => {
  // TODO - get this from an env variable
  cy.intercept('https://dev.stately.ai/registry/api/graphql', {
    body: {
      data,
    },
  });
};

const installInspectorProxyListener = () => {
  const inspectorProxyListener = (event: MessageEvent<any>) => {
    if (
      event.data &&
      typeof event.data === 'object' &&
      typeof event.data.type === 'string' &&
      /^xstate\./.test(event.data.type)
    ) {
      window.dispatchEvent(new MessageEvent(event.type, { data: event.data }));
    }
  };
  window.parent.addEventListener('message', inspectorProxyListener);

  state('@@viz/removeInspectorProxyListener', () =>
    window.parent.removeEventListener('message', inspectorProxyListener),
  );
};

const visitInspector = () => {
  if (state('@@viz/inspectorInitialized')) {
    throw new Error('Inspector has already been visited in this test.');
  }
  state('@@viz/inspectorInitialized', true);

  cy.log('Visit inspector');
  cy.wrap(null, { log: false }).then(() => {
    installInspectorProxyListener();

    // `inspect` sets the `iframe.src` internally
    const inspector = inspect({
      iframe: () =>
        window.parent.document.querySelector<HTMLIFrameElement>('.aut-iframe'),
      url: `${Cypress.config('baseUrl')!}/viz?inspect`,
    })!;
    state('@@viz/inspector', inspector);
  });
};

const waitOnInspector = (inspector: Inspector) =>
  new Promise<void>((resolve) => {
    let resolved = false;
    let unsubscribe: () => void;

    unsubscribe = inspector.subscribe((state) => {
      if (state.value === 'connected') {
        resolved = true;
        if (unsubscribe) {
          unsubscribe();
        }
        resolve();
      }
    }).unsubscribe;

    // it's a hack to trigger the underlying subscribe's callback
    // that will call our local callback here synchronously with the current state
    inspector.send({ type: 'unknown_ping' } as any);

    if (resolved) {
      unsubscribe();
    }
  });

function inspectMachine<T extends StateMachine<any, any, any, any>>(
  machine: T,
) {
  const inspector = state('@@viz/inspector');
  if (!inspector) {
    throw new Error(
      '`cy.inspectMachine` can only be used after `cy.visitInspector`',
    );
  }

  cy.log(`inspectMachine: ${machine.id}`);

  return cy.window({ log: false }).then(() => {
    return waitOnInspector(inspector).then(() => {
      const service = interpret(machine, { devTools: true });

      // temp fix for @xstate/inspect bug
      // we are interpreting machines when the inspect machine is already in the `connected` state
      // this makes this `service.event` sent to the inspector right within the `.start()` call:
      // https://github.com/statelyai/xstate/blob/fb7ea97465dfba0b7ef17edbf327c7c21848c7e8/packages/xstate-inspect/src/browser.ts#L171-L175
      // but the `service._state` has never been assigned yet up to this point so it's `undefined`
      // that gets forwarded to the inspector and throws here on `JSON.parse(undefined)`:
      // https://github.com/statelyai/xstate/blob/fb7ea97465dfba0b7ef17edbf327c7c21848c7e8/packages/xstate-inspect/src/utils.ts#L38
      (service as any)._state = service.initialState;

      return service.start() as InterpreterFrom<T>;
    });
  });
}

const getCanvas = () => {
  return cy.findByTestId('canvas-graph');
};

/**
 * Grab the monaco editor. Added here
 * to allow for test brevity
 */
const getMonacoEditor = () => {
  return cy.get('.monaco-editor').first();
};

const getPanelsView = () => {
  return cy.findByTestId('panels-view');
};

type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? _DeepPartialArray<U>
  : T extends object
  ? _DeepPartialObject<T>
  : T | undefined;

interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type _DeepPartialObject<T> = { [P in keyof T]?: DeepPartial<T[P]> };

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Sets a mock auth token into localStorage to
       * mimic us being logged in to Supabase
       */
      setMockAuthToken: typeof setMockAuthToken;

      /**
       * Allows the tester to mock the GraphQL API to return whatever
       * values they like
       */
      interceptGraphQL: typeof interceptGraphQL;

      getCanvas: typeof getCanvas;

      getMonacoEditor: typeof getMonacoEditor;

      visitInspector: typeof visitInspector;

      inspectMachine: typeof inspectMachine;

      getPanelsView: typeof getPanelsView;
    }
  }
}

Cypress.Commands.add('setMockAuthToken', setMockAuthToken);
Cypress.Commands.add('getMonacoEditor', getMonacoEditor);
Cypress.Commands.add('getCanvas', getCanvas);
Cypress.Commands.add('interceptGraphQL', interceptGraphQL);
Cypress.Commands.add('visitInspector', visitInspector);
Cypress.Commands.add('inspectMachine', inspectMachine);
Cypress.Commands.add('getPanelsView', getPanelsView);
