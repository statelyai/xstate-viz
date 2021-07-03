import { createStandaloneToast, UseToastOptions } from '@chakra-ui/react';
import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';

const toast = createStandaloneToast();

const notifModel = createModel(
  {},
  {
    events: {
      ERROR: (message: string) => ({ message }),
      BROADCAST: (message: string, status: UseToastOptions['status']) => ({
        message,
        status,
      }),
    },
  },
);
export const notifMachine = createMachine<typeof notifModel>({
  context: {},
  initial: 'running',
  on: {
    BROADCAST: {
      actions: [
        (_, e) => {
          if (!toast.isActive(e.message)) {
            toast({
              id: e.message,
              status: e.status,
              title: e.status?.toUpperCase(),
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
    running: {},
  },
});
