import { createDevTools } from '@xstate/inspect';

const devTools = createDevTools();

devTools.onRegister((s) => {
  console.log('REGISTER', s);
});

// @ts-ignore
globalThis.__xstate__ = devTools;

export { devTools };
