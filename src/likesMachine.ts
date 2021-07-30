import { createMachine, assign } from 'xstate';

interface Context {
  likesCount: number | undefined;
}

type Event =
  | {
      type: 'LIKES_CHANGED';
      youHaveLiked: boolean | undefined;
      likesCount: number | undefined;
    }
  | {
      type: 'CLICK_BUTTON';
    };

export const likesMachine = createMachine<Context, Event>({
  id: 'likes',
  initial: 'checkingIfLiked',
  on: {
    LIKES_CHANGED: [
      {
        cond: (ctx, e) => typeof e.youHaveLiked === 'undefined',
        target: '.checkingIfLiked',
      },
      {
        cond: (ctx, e) => e.youHaveLiked!,
        target: '.liked',
        actions: assign((context, event) => {
          return {
            likesCount: event.likesCount,
          };
        }),
      },
      {
        target: '.notLiked',
        actions: assign((context, event) => {
          return {
            likesCount: event.likesCount,
          };
        }),
      },
    ],
  },
  states: {
    checkingIfLiked: {
      tags: 'hidden',
    },
    liked: {
      tags: ['liked'],
      on: {
        CLICK_BUTTON: [
          { cond: 'isLoggedIn', target: 'unliking' },
          { actions: 'reportLoggedOutUserTriedToLike' },
        ],
      },
    },
    notLiked: {
      tags: ['notLiked'],
      on: {
        CLICK_BUTTON: [
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
