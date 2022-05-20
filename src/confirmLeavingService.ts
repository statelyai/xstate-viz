import { createModel } from 'xstate/lib/model';

/**
 * This is an invoked callback which asks the user
 * to confirm before leaving the browser
 */
export const confirmBeforeLeavingService = () => () => {
  const onUnload = (evt: BeforeUnloadEvent) => {
    evt.returnValue = 'Are you sure you want to close this window?';
    return 'Are you sure you want to close this window?';
  };
  window.addEventListener('beforeunload', onUnload);

  return () => {
    window.removeEventListener('beforeunload', onUnload);
  };
};

export const confirmBeforeLeavingMachine = createModel(
  {},
  {
    events: {
      CODE_UPDATED: () => ({}),
    },
  },
).createMachine({
  tsTypes: {} as import("./confirmLeavingService.typegen").Typegen0,
  initial: 'notConfirming',
  on: {
    CODE_UPDATED: {
      target: 'confirming',
    },
  },
  states: {
    notConfirming: {},
    confirming: {
      invoke: {
        src: confirmBeforeLeavingService,
      },
    },
  },
});
