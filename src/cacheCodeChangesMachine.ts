import { createModel } from 'xstate/lib/model';
import { localCache } from './localCache';

const cacheCodeChangesModel = createModel(
  {
    code: '',
    sourceID: null as string | null,
  },
  {
    events: {
      CODE_UPDATED: (code: string, sourceID: string | null) => ({
        code,
        sourceID,
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
          sourceID: event.sourceID,
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
          localCache.saveSourceRawContent(ctx.sourceID, ctx.code);
        },
        target: 'idle',
      },
    },
  },
});
