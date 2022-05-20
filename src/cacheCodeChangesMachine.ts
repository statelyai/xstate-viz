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

export const cacheCodeChangesMachine = cacheCodeChangesModel.createMachine(
  {
    initial: 'idle',
    tsTypes: {} as import("./cacheCodeChangesMachine.typegen").Typegen0,
    on: {
      CODE_UPDATED: {
        target: '.throttling',
        internal: false,
        actions: 'assignCodeToContext',
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
  },
  {
    actions: {
      assignCodeToContext: cacheCodeChangesModel.assign((ctx, event) => {
        return {
          code: event.code,
          sourceID: event.sourceID,
        };
      }),
    },
  },
);
