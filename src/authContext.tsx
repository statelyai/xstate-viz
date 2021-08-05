import { InterpreterFrom } from 'xstate';
import { authMachine } from './authMachine';
import { createInterpreterContext } from './utils';

const [AuthProvider, useAuth, createAuthSelector] =
  createInterpreterContext<InterpreterFrom<typeof authMachine>>('Auth');

export { AuthProvider, useAuth };

export const useLoggedInUserData = createAuthSelector(
  (state) => state.context.loggedInUserData,
);
