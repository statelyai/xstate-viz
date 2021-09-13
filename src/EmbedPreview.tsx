import { useMachine } from '@xstate/react';
import { createModel } from 'xstate/lib/model';
import { send } from 'xstate';

const embedPreviewModel = createModel(
  {
    embedUrl: '',
  },
  {
    events: {
      PARAMS_CHANGED: (params: { foo: string }) => ({ params }),
      PREVIEW: () => ({}),
      IFRAME_LOADED: () => ({}),
      IFRAME_ERROR: () => ({}),
    },
  },
);

const embedPreviewMachine = embedPreviewModel.createMachine({
  entry: send('ada'),
});

useMachine(embedPreviewMachine, {
  actions: {
    saveParams: embedPreviewModel.assign({
      embedUrl: (_, e) => (e as any).params,
    }),
  },
});
