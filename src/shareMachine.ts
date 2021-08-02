import { createModel } from 'xstate/lib/model';

const model = createModel(
  {},
  {
    events: {
      CLICK_SHARE: () => ({}),
      COPY_LINK: () => ({}),
      SHARE_ON_TWITTER: () => ({}),
    },
  },
);

export const shareMachine = model.createMachine({
  id: 'shareMachine',
  on: {
    COPY_LINK: {
      target: '.pending',
    },
    SHARE_ON_TWITTER: {
      actions: 'openTwitterShareLink',
    },
  },
  initial: 'notCopied',
  states: {
    notCopied: {},
    pending: {
      tags: ['loading'],
      meta: {
        description: `
          A fake pending state to give the user
          some visual feedback
        `,
      },
      after: {
        250: {
          target: 'copied',
        },
      },
    },
    copied: {
      entry: ['copyLinkToClipboard'],
      tags: 'copied',
    },
  },
});
