import { InterpreterFrom } from 'xstate';
import { appMachine } from './appMachine';
import { createInterpreterContext } from './utils';

const [AppProvider, useAppService] =
  createInterpreterContext<InterpreterFrom<typeof appMachine>>('App');

export { AppProvider, useAppService };
