import { createMachine, assign } from 'xstate';

interface Context {
  likesCount: number | undefined;
}

type Event =
  | {
      type: 'SOURCE_DATA_CHANGED';
      data:
        | {
            youHaveLiked: boolean;
            likesCount: number;
          }
        | undefined
        | null;
    }
  | {
      type: 'LIKE_BUTTON_TOGGLED';
    };

export const likesMachine = createMachine<Context, Event>({
  id: 'likes',
  initial: 'waitingForSourceData',
  on: {
    SOURCE_DATA_CHANGED: [
      {
        cond: (ctx, e) => !e.data,
        target: '.waitingForSourceData',
      },
      {
        cond: (ctx, e) => e.data!.youHaveLiked,
        target: '.liked',
        actions: assign((context, event) => {
          return {
            likesCount: event.data!.likesCount,
          };
        }),
      },
      {
        target: '.notLiked',
        actions: assign((context, event) => {
          return {
            likesCount: event.data!.likesCount,
          };
        }),
      },
    ],
  },
  states: {
    waitingForSourceData: {
      tags: 'hidden',
    },
    liked: {
      tags: ['liked'],
      on: {
        LIKE_BUTTON_TOGGLED: [
          { cond: 'isLoggedIn', target: 'unliking' },
          { actions: 'reportLoggedOutUserTriedToLike' },
        ],
      },
    },
    notLiked: {
      tags: ['notLiked'],
      on: {
        LIKE_BUTTON_TOGGLED: [
          { cond: 'isLoggedIn', target: 'liking' },
          { actions: 'reportLoggedOutUserTriedToLike' },
        ],
      },
    },
    liking: {
      tags: ['liked', 'pending'],
      invoke: {
        src: 'like',
        onDone: {
          target: 'liked',
          actions: assign({
            likesCount: (ctx) => {
              if (typeof ctx.likesCount !== 'undefined') {
                return ctx.likesCount + 1;
              }
            },
          }),
        },
        onError: {
          target: 'notLiked',
          actions: 'reportLikeFailure',
        },
      },
    },
    unliking: {
      tags: ['notLiked', 'pending'],
      invoke: {
        src: 'unlike',
        onDone: {
          target: 'notLiked',
          actions: assign({
            likesCount: (ctx) => {
              if (typeof ctx.likesCount !== 'undefined') {
                return ctx.likesCount - 1;
              }
            },
          }),
        },
        onError: {
          target: 'liked',
          actions: 'reportUnlikeFailed',
        },
      },
    },
  },
});
