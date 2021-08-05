// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// ***********************************************************

import { InspectorOptions } from '@xstate/inspect';
import './commands';
import { state } from './state';

type AnyFunction = (...args: any[]) => any;

declare global {
  interface Window {
    __xstate__: Exclude<InspectorOptions['devTools'], AnyFunction>;
  }
}

afterEach(() => {
  const inspector = state('@@viz/inspector');
  if (!inspector) {
    return;
  }
  inspector.disconnect();
  // https://github.com/statelyai/xstate/blob/fb7ea97465dfba0b7ef17edbf327c7c21848c7e8/packages/xstate-inspect/src/browser.ts#L68
  const devTools = window.__xstate__;
  devTools.services.forEach(devTools.unregister);
});
