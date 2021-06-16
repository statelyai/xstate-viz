import { createContext } from 'react';
import { State, Interpreter } from 'xstate';

export const CanvasContext = createContext<
  [State<any, any, any>, Interpreter<any, any, any>['send']]
>(null as any);
