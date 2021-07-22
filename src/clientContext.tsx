import { InterpreterFrom } from 'xstate';
import { clientMachine } from './authMachine';
import { createRequiredContext } from './utils';

export const [ClientProvider, useClient] =
  createRequiredContext<InterpreterFrom<typeof clientMachine>>('Simulation');
