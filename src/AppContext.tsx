import { InterpreterFrom } from 'xstate';
import { createInterpreterContext } from './utils';
import { appMachine } from './appMachine';

const [AppProvider, useAppService] =
  createInterpreterContext<InterpreterFrom<typeof appMachine>>('App');

export { AppProvider, useAppService };
