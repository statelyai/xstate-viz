import * as XState from 'xstate';
import * as XStateModel from 'xstate/lib/model';
import * as XStateActions from 'xstate/lib/actions';
import { StateNode } from 'xstate';
import realmsShim from 'realms-shim';

const realm = realmsShim.makeRootRealm();

function wrapToPreventThis<F extends (...args: any[]) => any>(callback: F): F {
  const wrapped: any = (...args: any[]) => {
    return callback(...args);
  };
  return wrapped;
}

const windowShim = {
  setInterval: (callback: (...args: any[]) => void, ...args: any[]) => {
    return setInterval(wrapToPreventThis(callback), ...args);
  },
  setTimeout: (callback: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(wrapToPreventThis(callback), ...args);
  },
  clearTimeout: (...args: any[]) => {
    return clearTimeout(...args);
  },
  clearInterval: (...args: any[]) => {
    return clearInterval(...args);
  },
  confirm: (...args: any[]) => {
    return confirm(...args);
  },
  prompt: (...args: any[]) => {
    return prompt(...args);
  },
};

export function parseMachines(sourceJs: string): Array<StateNode> {
  const machines: Array<StateNode> = [];

  const createMachineCapturer = (machineFactory: any) =>
    function (...args: any[]) {
      const machine = machineFactory.apply(
        // @ts-ignore
        this as any,
        args,
      );
      machines.push(machine);

      machine.withConfig = createMachineCapturer(machine.withConfig);
      machine.withContext = createMachineCapturer(machine.withContext);

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
            createMachine: createMachineCapturer(
              wrapToPreventThis(XState.createMachine),
            ),
            Machine: createMachineCapturer(wrapToPreventThis(XState.Machine)),
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
    window: globalThis,
    ...windowShim,
  });

  return machines;
}
