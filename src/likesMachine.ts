import { ActorRefFrom, assign, createMachine, send, spawn } from 'xstate';
import { notifMachine } from './notificationMachine';

interface Context {
  likesCount: number | undefined;
  notifRef: ActorRefFrom<typeof notifMachine>;
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
  entry: assign<Context, Event>({
    notifRef: () => spawn(notifMachine),
  }),
  on: {
    SOURCE_DATA_CHANGED: [
      {
        cond: (_, e) => !e.data,
        target: '.waitingForSourceData',
      },
      {
        cond: (_, e) => e.data!.youHaveLiked,
        target: '.liked',
        actions: assign((_, event) => {
          return {
            likesCount: event.data!.likesCount,
          };
        }),
      },
      {
        target: '.notLiked',
        actions: assign((_, event) => {
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
          actions: send(
            {
              type: 'BROADCAST',
              message: 'Liking failed - an unknown error occurred.',
              status: 'error',
            },
            {
              to: (ctx) => ctx.notifRef,
            },
          ),
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
          actions: send(
            {
              type: 'BROADCAST',
              message: 'Unliking failed - an unknown error occurred.',
              status: 'error',
            },
            {
              to: (ctx) => ctx.notifRef,
            },
          ),
        },
      },
    },
  },
});
