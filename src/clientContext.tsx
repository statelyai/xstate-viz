import { InterpreterFrom } from 'xstate';
import { clientMachine } from './clientMachine';
import { createRequiredContext } from './utils';

export const [ClientProvider, useClient] = createRequiredContext<
  InterpreterFrom<typeof clientMachine>
>('Simulation');
