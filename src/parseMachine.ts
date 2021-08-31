import * as XState from 'xstate';
import * as XStateModel from 'xstate/lib/model';
import * as XStateActions from 'xstate/lib/actions';
import { StateNode } from 'xstate';
import realmsShim from 'realms-shim';

const realm = realmsShim.makeRootRealm();

/**
 * Wraps a callback in a function to prevent
 * accessing 'this'
 */
const wrapCallbackToPreventThis = (callback: () => void) => () => {
  return callback();
};

const windowShim = {
  setInterval: (callback: () => void, ...args: any[]) => {
    return setInterval(wrapCallbackToPreventThis(callback), ...args);
  },
  setTimeout: (callback: () => void, ...args: any[]) => {
    return setTimeout(wrapCallbackToPreventThis(callback), ...args);
  },
  clearTimeout: (...args: any[]) => {
    return clearTimeout(...args);
  },
  clearInterval: (...args: any[]) => {
    return clearInterval(...args);
  },
};

export function parseMachines(sourceJs: string): Array<StateNode> {
  const machines: Array<StateNode> = [];

  const createMachineCapturer =
    (machineFactory: any) =>
    (...args: any[]) => {
      const machine = machineFactory(...args);
      machines.push(machine);
      return machine;
    };

  realm.evaluate(sourceJs, {
    // we just allow for export statements to be used in the source code
    // we don't have any use for the exported values so we just mock the `exports` object
    exports: {},
    require: (sourcePath: string) => {
      switch (sourcePath) {
        case 'xstate':
          return {
            ...XState,
            createMachine: createMachineCapturer(XState.createMachine),
            Machine: createMachineCapturer(XState.Machine),
          };
        case 'xstate/lib/actions':
          return XStateActions;
        case 'xstate/lib/model':
          const { createModel } = XStateModel;
          return {
            ...XStateModel,
            createModel(initialContext: any, creators: any) {
              const model = createModel(initialContext, creators);
              return {
                ...model,
                createMachine: createMachineCapturer(model.createMachine),
              };
            },
          };
        default:
          throw new Error(`External module ("${sourcePath}") can't be used.`);
      }
    },
    // users might want to access `console` in the sandboxed env
    console: {
      error: console.error,
      info: console.info,
      log: console.log,
      warn: console.warn,
    },
    ...windowShim,
  });

  return machines;
}
