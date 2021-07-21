import { createModel } from 'xstate/lib/model';
import { localCache } from './localCache';

const cacheCodeChangesModel = createModel(
  {
    code: '',
    sourceId: null as string | null,
  },
  {
    events: {
      CODE_UPDATED: (code: string, sourceId: string | null) => ({
        code,
        sourceId,
      }),
    },
  },
);

export const cacheCodeChangesMachine = cacheCodeChangesModel.createMachine({
  initial: 'idle',
  on: {
    CODE_UPDATED: {
      target: '.throttling',
      internal: false,
      actions: cacheCodeChangesModel.assign((ctx, event) => {
        return {
          code: event.code,
          sourceId: event.sourceId,
        };
      }),
    },
  },
  states: {
    idle: {},
    throttling: {
      after: {
        300: 'saving',
      },
    },
    saving: {
      always: {
        actions: (ctx) => {
          localCache.saveSourceRawContent(ctx.sourceId, ctx.code);
        },
        target: 'idle',
      },
    },
  },
});
