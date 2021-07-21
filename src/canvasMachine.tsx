import { createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { Point } from './pathUtils';

export const canvasModel = createModel(
  {
    zoom: 1,
    pan: {
      dx: 0,
      dy: 0,
    },
    initialPosition: { x: 0, y: 0 },
  },
  {
    events: {
      'ZOOM.OUT': () => ({}),
      'ZOOM.IN': () => ({}),
      'POSITION.SET': ({ x, y }: Point) => ({ position: { x, y } }),
      PAN: (dx: number, dy: number) => ({ dx, dy }),
    },
  },
);

const ZOOM_IN_FACTOR = 1.15;
// exactly reversed factor so zooming in & out results in the same zoom values
const ZOOM_OUT_FACTOR = 1 / ZOOM_IN_FACTOR;

export const canvasMachine = createMachine<typeof canvasModel>({
  context: canvasModel.initialContext,
  on: {
    'ZOOM.OUT': {
      actions: canvasModel.assign({
        zoom: (ctx) => ctx.zoom * ZOOM_OUT_FACTOR,
      }),
      cond: (ctx) => ctx.zoom > 0.5,
    },
    'ZOOM.IN': {
      actions: canvasModel.assign({ zoom: (ctx) => ctx.zoom * ZOOM_IN_FACTOR }),
    },
    PAN: {
      actions: canvasModel.assign({
        pan: (ctx, e) => {
          return {
            dx: ctx.pan.dx - e.dx,
            dy: ctx.pan.dy - e.dy,
          };
        },
      }),
    },
    'POSITION.SET': {
      actions: canvasModel.assign({
        initialPosition: (_, e) => e.position,
      }),
    },
  },
});
