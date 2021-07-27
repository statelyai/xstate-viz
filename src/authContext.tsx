import { InterpreterFrom } from 'xstate';
import { authMachine } from './authMachine';
import { createRequiredContext } from './utils';

export const [AuthProvider, useAuth, createAuthSelector] =
  createRequiredContext<InterpreterFrom<typeof authMachine>>('Auth');

export const getLoggedInUserData = createAuthSelector(
  (state) => state.context.loggedInUserData,
);
