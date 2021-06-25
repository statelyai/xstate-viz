import { createStandaloneToast } from '@chakra-ui/react';
import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';

const toast = createStandaloneToast();

const notifModel = createModel(
  {},
  {
    events: {
      ERROR: (message: string) => ({ message }),
    },
  },
);
export const notifMachine = createMachine<typeof notifModel>({
  initial: 'running',
  context: {},
  on: {
    ERROR: {
      actions: [
        (_, e) => {
          if (!toast.isActive(e.message)) {
            toast({
              id: e.message,
              status: 'error',
              title: 'Error',
              description: e.message,
              isClosable: true,
              position: 'bottom-right',
            });
          }
        },
      ],
    },
  },
  states: {
    running: { entry: 'notif is running' },
  },
});
