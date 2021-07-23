import { assign, createMachine } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { ModelEventsFrom } from 'xstate/lib/model.types';
import { localCache } from './localCache';

export const canvasModel = createModel(
  {
    zoom: 1,
    pan: {
      dx: 0,
      dy: 0,
    },
  },
  {
    events: {
      'ZOOM.OUT': () => ({}),
      'ZOOM.IN': () => ({}),
      PAN: (dx: number, dy: number) => ({ dx, dy }),
      /**
       * Occurs when a source changed id
       */
      SOURCE_CHANGED: (id: string | null) => ({
        id,
      }),
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
      target: '.throttling',
      internal: false,
    },
    'ZOOM.IN': {
      actions: canvasModel.assign({ zoom: (ctx) => ctx.zoom * ZOOM_IN_FACTOR }),
      target: '.throttling',
      internal: false,
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
      target: '.throttling',
      internal: false,
    },
    SOURCE_CHANGED: {
      target: '.throttling',
      internal: false,
      actions: assign((context, event) => {
        const position = getPositionFromEvent(event);

        if (!position) return {};

        return position;
      }),
    },
  },
  initial: 'idle',
  states: {
    idle: {},
    throttling: {
      after: {
        300: 'saving',
      },
      meta: {
        description: `
          Throttling a moment before saving to ensure
          we don't do too much saving to localStorage
        `,
      },
    },
    saving: {
      always: {
        actions: 'persistPositionToLocalStorage',
        target: 'idle',
      },
    },
  },
});

const getPositionFromEvent = (event: ModelEventsFrom<typeof canvasModel>) => {
  if (event.type !== 'SOURCE_CHANGED') return null;

  const position = localCache.getPosition(event.id);
  return position;
};
