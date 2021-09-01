import { Inspector } from '@xstate/inspect';

interface State {
  (key: '@@viz/inspectorInitialized'): boolean | undefined;
  (key: '@@viz/inspectorInitialized', initialized: true): void;
  (key: '@@viz/removeInspectorProxyListener'): (() => void) | undefined;
  (key: '@@viz/removeInspectorProxyListener', removeListener: () => void): void;
  (key: '@@viz/inspector'): Inspector | undefined;
  (key: '@@viz/inspector', inspector: Inspector): void;
}

// wrap `cy.state` since it's not documented and thus it's also not typed so we have to type it ourselves
export const state: State = (...args: any[]) => (cy as any).state(...args);
