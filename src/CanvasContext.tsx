import { InterpreterFrom } from 'xstate';
import { canvasMachine } from './canvasMachine';
import { createInterpreterContext, createRequiredContext } from './utils';

export const [CanvasProvider, useCanvas, createCanvasMachineSelector] =
  createInterpreterContext<InterpreterFrom<typeof canvasMachine>>('Canvas');
