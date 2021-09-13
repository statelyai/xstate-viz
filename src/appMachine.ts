import { createMachine } from 'xstate';
import { parse } from 'querystring';
import { parseEmbedQuery, withoutEmbedQueryParams } from './utils';
import { EmbedMode } from './types';

export const appMachine = createMachine({
  id: 'app',
  context: () => {
    const query =
      typeof location !== 'undefined'
        ? parse(location.search.slice(1))
        : undefined;

    return {
      ...parseEmbedQuery(query),
      isEmbedded: false,
      originalUrl: withoutEmbedQueryParams(query),
    };
  },
  initial: 'unknown',
  states: {
    unknown: {
      always: [
        {
          cond: (ctx) => ctx.mode === EmbedMode.Full,
          target: EmbedMode.Full,
        },
        {
          cond: (ctx) => ctx.mode === EmbedMode.Panels,
          target: EmbedMode.Panels,
        },
        {
          cond: (ctx) => ctx.mode === EmbedMode.Viz,
          target: EmbedMode.Viz,
        },
        EmbedMode.Full,
      ],
    },
    [EmbedMode.Full]: {
      on: {
        'PANELS.TOGGLE': EmbedMode.Viz,
      },
    },
    [EmbedMode.Panels]: {},
    [EmbedMode.Viz]: {
      on: {
        'PANELS.TOGGLE': EmbedMode.Full,
      },
    },
  },
});
