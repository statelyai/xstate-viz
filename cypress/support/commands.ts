/// <reference types="cypress" />

import '@testing-library/cypress/add-commands';
import { inspect, Inspector } from '@xstate/inspect';
import 'cypress-localstorage-commands';
import 'cypress-real-events/support';
import { interpret, InterpreterFrom, StateMachine } from 'xstate';
import { SourceFile } from '../../src/apiTypes';
import { ParsedEmbed } from '../../src/types';
import { state } from './state';

const setMockAuthToken = () => {
  cy.setCookie('supabase-auth-token', 'mock-auth-token');
};

const interceptAPI = <T>(data: DeepPartial<T>) => {
  const baseUrl = process.env.NEXT_PUBLIC_REGISTRY_PUBLIC_URL;
  const apiUrlGlob = `${baseUrl}/api/v1/viz/*`;
  cy.intercept('POST', apiUrlGlob, {
    statusCode: 200,
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

/**
 * Allows you to visit the /viz/:id page and mock
 * its SSR return
 */
const visitVizWithNextPageProps = (data: Partial<SourceFile>) => {
  cy.visit(
    `/viz/${data.id}?ssr=${encodeURIComponent(
      JSON.stringify({ data, id: data.id }),
    )}`,
  );
};

const visitEmbedWithNextPageProps = ({
  mode,
  panel,
  readOnly,
  showOriginalLink,
  pan,
  zoom,
  controls,
  sourceFile,
}: Partial<ParsedEmbed> & {
  sourceFile: Partial<SourceFile>;
}) => {
  const path = sourceFile ? `/viz/embed/${sourceFile.id}` : '/viz/embed';
  const searchParams = new URLSearchParams();
  if (sourceFile) {
    searchParams.set(
      'ssr',
      JSON.stringify({ data: sourceFile, id: sourceFile.id }),
    );
  }
  if (mode) {
    searchParams.set('mode', mode);
  }
  if (panel) {
    searchParams.set('panel', panel);
  }
  if (typeof readOnly === 'boolean') {
    searchParams.set('readOnly', String(Number(readOnly)));
  }
  if (typeof showOriginalLink === 'boolean') {
    searchParams.set('showOriginalLink', String(Number(showOriginalLink)));
  }
  if (typeof pan === 'boolean') {
    searchParams.set('pan', String(Number(pan)));
  }
  if (typeof zoom === 'boolean') {
    searchParams.set('zoom', String(Number(zoom)));
  }
  if (typeof showOriginalLink === 'boolean') {
    searchParams.set('showOriginalLink', String(Number(showOriginalLink)));
  }
  if (typeof controls === 'boolean') {
    searchParams.set('controls', String(Number(controls)));
  }
  cy.visit(`${path}?${searchParams}`);
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

const getCanvasHeader = () => {
  return cy.findByTestId('canvas-header');
};

const getStatePanel = () => {
  return cy.findByTestId('state-panel');
};

const getCanvasGraph = () => {
  return cy.findByTestId('canvas-graph');
};

const getControlButtons = () => {
  return cy.findByTestId('controls');
};

const getEmbedPreview = () => cy.findByTestId('embed-preview');
const getResizeHandle = () => {
  return cy.findByTestId('resize-handle');
};

const getResetButton = () => cy.findByText('RESET');
const getFitToContentButton = () => cy.findByLabelText('Fit to content');

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
      interceptAPI: typeof interceptAPI;

      getCanvas: typeof getCanvas;

      getMonacoEditor: typeof getMonacoEditor;

      visitInspector: typeof visitInspector;

      inspectMachine: typeof inspectMachine;

      visitVizWithNextPageProps: typeof visitVizWithNextPageProps;

      visitEmbedWithNextPageProps: typeof visitEmbedWithNextPageProps;

      getPanelsView: typeof getPanelsView;

      getCanvasHeader: typeof getCanvasHeader;

      getStatePanel: typeof getStatePanel;

      getCanvasGraph: typeof getCanvasGraph;

      getControlButtons: typeof getControlButtons;

      getEmbedPreview: typeof getEmbedPreview;
      getResizeHandle: typeof getResizeHandle;

      getResetButton: typeof getResetButton;

      getFitToContentButton: typeof getFitToContentButton;
    }
  }
}

Cypress.Commands.add('setMockAuthToken', setMockAuthToken);
Cypress.Commands.add('getMonacoEditor', getMonacoEditor);
Cypress.Commands.add('getCanvas', getCanvas);
Cypress.Commands.add('interceptAPI', interceptAPI);
Cypress.Commands.add('visitInspector', visitInspector);
Cypress.Commands.add('inspectMachine', inspectMachine);
Cypress.Commands.add('visitVizWithNextPageProps', visitVizWithNextPageProps);
Cypress.Commands.add(
  'visitEmbedWithNextPageProps',
  visitEmbedWithNextPageProps,
);
Cypress.Commands.add('getPanelsView', getPanelsView);
Cypress.Commands.add('getCanvasHeader', getCanvasHeader);
Cypress.Commands.add('getStatePanel', getStatePanel);
Cypress.Commands.add('getCanvasGraph', getCanvasGraph);
Cypress.Commands.add('getControlButtons', getControlButtons);
Cypress.Commands.add('getEmbedPreview', getEmbedPreview);
Cypress.Commands.add('getResizeHandle', getResizeHandle);
Cypress.Commands.add('getResetButton', getResetButton);
Cypress.Commands.add('getFitToContentButton', getFitToContentButton);
