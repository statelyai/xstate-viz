import { InterpreterFrom, StateFrom } from 'xstate';
import { createInterpreterContext } from './utils';
import { appMachine } from './appMachine';
import { EmbedMode } from './types';

const [AppProvider, useAppService] =
  createInterpreterContext<InterpreterFrom<typeof appMachine>>('App');

export { AppProvider, useAppService };

export const selectAppMode = (state: StateFrom<typeof appMachine>) =>
  state.value as EmbedMode;
