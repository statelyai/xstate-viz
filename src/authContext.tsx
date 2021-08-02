import { InterpreterFrom } from 'xstate';
import { authMachine } from './authMachine';
import { createInterpreterContext } from './utils';

export const [
  AuthProvider,
  useAuth,
  createAuthSelector,
] = createInterpreterContext<InterpreterFrom<typeof authMachine>>('Auth');

export const getLoggedInUserData = createAuthSelector(
  (state) => state.context.loggedInUserData,
);
