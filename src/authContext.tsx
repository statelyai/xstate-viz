import { InterpreterFrom } from 'xstate';
import { AuthMachine } from './authMachine';
import { createInterpreterContext } from './utils';

const [AuthProvider, useAuth, createAuthSelector] =
  createInterpreterContext<InterpreterFrom<AuthMachine>>('Auth');

export { AuthProvider, useAuth };

export const useLoggedInUserData = createAuthSelector(
  (state) => state.context.loggedInUserData,
);
