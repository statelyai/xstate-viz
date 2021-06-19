import { createContext } from 'react';
import { canvasMachine } from './canvasMachine';
import { InterpreterOf } from './types';

export const CanvasContext = createContext<InterpreterOf<typeof canvasMachine>>(
  null as any,
);
