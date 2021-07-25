import { createModel } from 'xstate/lib/model';

const paletteModel = createModel(
  {
    commandEventHandlerFactory: (sendBack: any) => (e: KeyboardEvent) => {},
  },
  {
    events: {
      SHOW_PALETTE: () => ({}),
      HIDE_PALETTE: () => ({}),
    },
  },
);

export const paletteMachine = paletteModel.createMachine({
  initial: 'closed',
  context: {
    ...paletteModel.initialContext,
    commandEventHandlerFactory: (sendBack) => (e: KeyboardEvent) => {
      console.log(e);
      if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') ||
        // Shift + / = ?
        (e.shiftKey && e.code === 'Slash')
      ) {
        sendBack('SHOW_PALETTE');
      }
    },
  },
  states: {
    closed: {
      invoke: {
        src: (ctx) => (sendBack) => {
          const handler = ctx.commandEventHandlerFactory(sendBack);
          window.addEventListener('keydown', handler);
          return () => {
            window.removeEventListener('keydown', handler);
          };
        },
      },
      on: {
        SHOW_PALETTE: 'opened',
      },
    },
    opened: {
      entry: 'saveListRef',
      on: {
        HIDE_PALETTE: 'closed',
      },
    },
  },
});
