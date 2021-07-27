import { assign, createMachine, StateFrom } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { ModelEventsFrom } from 'xstate/lib/model.types';
import { localCache } from './localCache';

const initialPosition = {
  zoom: 1,
  pan: {
    dx: 0,
    dy: 0,
  },
};

export const canvasModel = createModel(initialPosition, {
  events: {
    'ZOOM.OUT': () => ({}),
    'ZOOM.IN': () => ({}),
    'POSITION.RESET': () => ({}),
    PAN: (dx: number, dy: number) => ({ dx, dy }),
    /**
     * Occurs when a source changed id
     */
    SOURCE_CHANGED: (id: string | null) => ({
      id,
    }),
  },
});

const ZOOM_IN_FACTOR = 1.15;
// exactly reversed factor so zooming in & out results in the same zoom values
const ZOOM_OUT_FACTOR = 1 / ZOOM_IN_FACTOR;
const MAX_ZOOM_OUT_FACTOR = 0.1;

const MAX_ZOOM_IN_FACTOR = 2;

export const canvasMachine = createMachine<typeof canvasModel>({
  context: canvasModel.initialContext,
  on: {
    'ZOOM.OUT': {
      actions: canvasModel.assign({
        zoom: (ctx) => ctx.zoom * ZOOM_OUT_FACTOR,
      }),
      cond: (ctx) => ctx.zoom > MAX_ZOOM_OUT_FACTOR,
      target: '.throttling',
      internal: false,
    },
    'ZOOM.IN': {
      actions: canvasModel.assign({ zoom: (ctx) => ctx.zoom * ZOOM_IN_FACTOR }),
      cond: (ctx) => ctx.zoom < MAX_ZOOM_IN_FACTOR,
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
    'POSITION.RESET': {
      actions: canvasModel.assign(initialPosition),
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

export const getShouldEnableZoomOutButton = (
  state: StateFrom<typeof canvasMachine>,
) => {
  return state.context.zoom > MAX_ZOOM_OUT_FACTOR;
};

export const getShouldEnableZoomInButton = (
  state: StateFrom<typeof canvasMachine>,
) => {
  return state.context.zoom < MAX_ZOOM_IN_FACTOR;
};
