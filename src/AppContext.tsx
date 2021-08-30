import { InterpreterFrom, StateFrom } from 'xstate';
import { createInterpreterContext } from './utils';
import { appMachine } from './appMachine';

const [AppProvider, useAppService] =
  createInterpreterContext<InterpreterFrom<typeof appMachine>>('App');

export { AppProvider, useAppService };

export const selectAppMode = (state: StateFrom<typeof appMachine>) =>
  state.matches({ panels: 'collapsed' }) ? 'viz' : 'full';
