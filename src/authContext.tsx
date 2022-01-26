import { AuthMachineInterpreter } from './authMachine';
import { createInterpreterContext } from './utils';

const [AuthProvider, useAuth, createAuthSelector] =
  createInterpreterContext<AuthMachineInterpreter>('Auth');

export { AuthProvider, useAuth };

export const useLoggedInUserData = createAuthSelector(
  (state) => state.context.loggedInUserData,
);
