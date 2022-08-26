import { createModel } from 'xstate/lib/model';

const model = createModel(
  {},
  {
    events: {
      COPY_LINK: () => ({}),
    },
  },
);

export const shareMachine = model.createMachine({
  tsTypes: {} as import("./shareMachine.typegen").Typegen0,
  id: 'shareMachine',
  on: {
    COPY_LINK: {
      target: '.pending',
    },
  },
  initial: 'notCopied',
  states: {
    notCopied: {},
    pending: {
      tags: ['loading'],
      description: `
        A fake pending state to give the user
        some visual feedback
      `,
      after: {
        250: {
          target: 'copied',
        },
      },
    },
    copied: {
      entry: ['copyLinkToClipboard'],
      tags: 'copied',
      after: {
        2000: {
          target: 'notCopied',
        },
      },
    },
  },
});
