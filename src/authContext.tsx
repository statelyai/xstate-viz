import { InterpreterFrom } from 'xstate';
import { authMachine } from './authMachine';
import { createRequiredContext } from './utils';

export const [AuthProvider, useAuth] =
  createRequiredContext<InterpreterFrom<typeof authMachine>>('Auth');
