import { send } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { ModelEventsFrom } from 'xstate/lib/model.types';
import { StateElkNode } from './graphUtils';
import { localCache } from './localCache';
import { EmbedContext, Point } from './types';

export enum ZoomFactor {
  slow = 1.09,
  normal = 1.15,
}

const initialPosition = {
  zoom: 1,
  viewbox: {
    x: 0,
    y: 0,
  },
  canvasPanelPosition: {
    offsetY: 50,
    offsetX: 0,
    width: 0,
    height: 0,
  },
};

const initialContext = {
  ...initialPosition,
  elkGraph: undefined as StateElkNode | undefined,
  embed: undefined as EmbedContext | undefined,
};

export interface Viewbox {
  x: number;
  y: number;
}

const LONG_PAN = 50;
const SHORT_PAN = 10;

export const canvasModel = createModel(initialContext, {
  events: {
    'ZOOM.OUT': (x?: number, y?: number, zoomFactor?: ZoomFactor) => ({
      zoomFactor,
      x,
      y,
    }),
    'ZOOM.IN': (x?: number, y?: number, zoomFactor?: ZoomFactor) => ({
      zoomFactor,
      x,
      y,
    }),
    'POSITION.RESET': () => ({}),
    PAN: (dx: number, dy: number) => ({ dx, dy }),
    'PAN.LEFT': (isLongPan?: boolean) => ({ isLongPan }),
    'PAN.RIGHT': (isLongPan?: boolean) => ({ isLongPan }),
    'PAN.UP': (isLongPan?: boolean) => ({ isLongPan }),
    'PAN.DOWN': (isLongPan?: boolean) => ({ isLongPan }),
    /**
     * Occurs when a source changed id
     */
    SOURCE_CHANGED: (id: string | null) => ({
      id,
    }),
    CANVAS_RECT_CHANGED: (
      offsetY: number,
      offsetX: number,
      width: number,
      height: number,
    ) => ({
      offsetX,
      offsetY,
      width,
      height,
    }),
    'elkGraph.UPDATE': (elkGraph: StateElkNode) => ({ elkGraph }),
    FIT_TO_VIEW: () => ({}),
  },
});

const DEFAULT_ZOOM_IN_FACTOR = ZoomFactor.normal;
// exactly reversed factor so zooming in & out results in the same zoom values
const calculateZoomOutFactor = (zoomInFactor: ZoomFactor = ZoomFactor.normal) =>
  1 / zoomInFactor;
const MAX_ZOOM_OUT_FACTOR = 0.1;

const MAX_ZOOM_IN_FACTOR = 2;

export const canZoom = (embed?: EmbedContext) => {
  return !embed?.isEmbedded || embed.zoom;
};

export const canZoomOut = (ctx: typeof initialContext) => {
  return ctx.zoom > MAX_ZOOM_OUT_FACTOR;
};

export const canZoomIn = (ctx: typeof initialContext) => {
  return ctx.zoom < MAX_ZOOM_IN_FACTOR;
};

export const canPan = (ctx: typeof initialContext) => {
  return !ctx.embed?.isEmbedded || (ctx.embed.isEmbedded && ctx.embed.pan);
};

/**
 * Implementation copied from:
 *
 * https://github.com/excalidraw/excalidraw/blob/10cd6a24b0d5715d25ad413784a4b5b57f500b79/src/scene/zoom.ts
 */
const getNewZoomAndViewbox = (
  prevZoomValue: number,
  newZoomValue: number,
  currentViewbox: Viewbox,
  cursorPosition: Point,
  canvasOffset: {
    offsetY: number;
    offsetX: number;
  },
): { zoom: number; viewbox: Viewbox } => {
  return {
    zoom: newZoomValue,
    viewbox: {
      x:
        cursorPosition.x -
        canvasOffset.offsetX -
        (cursorPosition.x - canvasOffset.offsetX - currentViewbox.x) *
          (newZoomValue / prevZoomValue),
      y:
        cursorPosition.y -
        canvasOffset.offsetY -
        (cursorPosition.y - canvasOffset.offsetY - currentViewbox.y) *
          (newZoomValue / prevZoomValue),
    },
  };
};

export const canvasMachine = canvasModel.createMachine({
  on: {
    CANVAS_RECT_CHANGED: {
      actions: canvasModel.assign((ctx, e) => {
        return {
          canvasPanelPosition: {
            offsetY: e.offsetY,
            offsetX: e.offsetX,
            height: e.height,
            width: e.width,
          },
        };
      }),
    },
    'ZOOM.OUT': {
      actions: canvasModel.assign((ctx, e) => {
        return getNewZoomAndViewbox(
          ctx.zoom,
          ctx.zoom * calculateZoomOutFactor(e.zoomFactor),
          ctx.viewbox,
          {
            x: e.x || ctx.canvasPanelPosition.width / 2,
            y: e.y || ctx.canvasPanelPosition.height / 2,
          },
          ctx.canvasPanelPosition,
        );
      }),
      cond: (ctx) => canZoom(ctx.embed) && canZoomOut(ctx),
      target: '.throttling',
      internal: false,
    },
    'ZOOM.IN': {
      actions: canvasModel.assign((ctx, e) => {
        return getNewZoomAndViewbox(
          ctx.zoom,
          ctx.zoom * (e.zoomFactor || DEFAULT_ZOOM_IN_FACTOR),
          ctx.viewbox,
          {
            x: e.x || ctx.canvasPanelPosition.width / 2,
            y: e.y || ctx.canvasPanelPosition.height / 2,
          },
          ctx.canvasPanelPosition,
        );
      }),
      cond: (ctx) => canZoom(ctx.embed) && canZoomIn(ctx),
      target: '.throttling',
      internal: false,
    },
    PAN: {
      actions: canvasModel.assign({
        viewbox: (ctx, e) => {
          return {
            x: ctx.viewbox.x + e.dx,
            y: ctx.viewbox.y + e.dy,
          };
        },
      }),
      cond: (ctx) => canPan(ctx),
      target: '.throttling',
      internal: false,
    },
    'PAN.LEFT': {
      actions: canvasModel.assign({
        viewbox: (ctx, e) => ({
          x: ctx.viewbox.x - (e.isLongPan ? LONG_PAN : SHORT_PAN),
          y: ctx.viewbox.y,
        }),
      }),
      target: '.throttling',
      internal: false,
    },
    'PAN.RIGHT': {
      actions: canvasModel.assign({
        viewbox: (ctx, e) => ({
          x: ctx.viewbox.x + (e.isLongPan ? LONG_PAN : SHORT_PAN),
          y: ctx.viewbox.y,
        }),
      }),
      target: '.throttling',
      internal: false,
    },
    'PAN.UP': {
      actions: canvasModel.assign({
        viewbox: (ctx, e) => ({
          x: ctx.viewbox.x,
          y: ctx.viewbox.y - (e.isLongPan ? LONG_PAN : SHORT_PAN),
        }),
      }),
      target: '.throttling',
      internal: false,
    },
    'PAN.DOWN': {
      actions: canvasModel.assign({
        viewbox: (ctx, e) => ({
          x: ctx.viewbox.x,
          y: ctx.viewbox.y + (e.isLongPan ? LONG_PAN : SHORT_PAN),
        }),
      }),
      target: '.throttling',
      internal: false,
    },
    'POSITION.RESET': {
      actions: canvasModel.assign({
        zoom: canvasModel.initialContext.zoom,
        viewbox: canvasModel.initialContext.viewbox,
      }),
      target: '.throttling',
      internal: false,
    },
    SOURCE_CHANGED: {
      target: '.throttling',
      internal: false,
      actions: canvasModel.assign((context, event) => {
        // TODO: This can be more elegant when we have system actor
        if (!context.embed?.isEmbedded) {
          const position = getPositionFromEvent(event);

          if (!position) return {};

          return position;
        }
        return {};
      }),
    },
    'elkGraph.UPDATE': {
      actions: [
        canvasModel.assign({
          elkGraph: (_, e) => e.elkGraph,
        }),
        send('FIT_TO_VIEW'),
      ],
    },
    FIT_TO_VIEW: {
      actions: [
        canvasModel.assign({
          zoom: (ctx) => {
            if (!ctx.elkGraph) return ctx.zoom;
            return (
              Math.min(
                ctx.canvasPanelPosition.width / ctx.elkGraph.width!,
                ctx.canvasPanelPosition.height / ctx.elkGraph.height!,
                MAX_ZOOM_IN_FACTOR,
              ) * 0.9 // Ensure machine does not touch sides
            );
          },
        }),
        canvasModel.assign({
          viewbox: (ctx) => {
            if (!ctx.elkGraph) return ctx.viewbox;
            return {
              x:
                ctx.canvasPanelPosition.width / 2 -
                (ctx.elkGraph.width! * ctx.zoom) / 2,
              y:
                ctx.canvasPanelPosition.height / 2 -
                (ctx.elkGraph.height! * ctx.zoom) / 2,
            };
          },
        }),
      ],
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
