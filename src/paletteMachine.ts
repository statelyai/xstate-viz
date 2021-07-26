import { createModel } from 'xstate/lib/model';

const paletteModel = createModel(undefined, {
  events: {
    SHOW_PALETTE: () => ({}),
    HIDE_PALETTE: () => ({}),
  },
});

export const paletteMachine = paletteModel.createMachine({
  initial: 'closed',
  states: {
    closed: {
      invoke: {
        src: () => (sendBack) => {
          const eventHandler = (e: KeyboardEvent) => {
            if (
              ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') ||
              // Shift + / = ?
              (e.shiftKey && e.code === 'Slash')
            ) {
              sendBack('SHOW_PALETTE');
            }
          };
          window.addEventListener('keydown', eventHandler);
          return () => {
            window.removeEventListener('keydown', eventHandler);
          };
        },
      },
      on: {
        SHOW_PALETTE: 'opened',
      },
    },
    opened: {
      on: {
        HIDE_PALETTE: 'closed',
      },
    },
  },
});
