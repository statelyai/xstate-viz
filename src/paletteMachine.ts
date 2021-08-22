import { createModel } from 'xstate/lib/model';
import { isWithPlatformMetaKey, isTextInputLikeElement } from './utils';

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
          function captureCommandPaletteKeybindings(e: KeyboardEvent) {
            const keybindings = {
              'CtrlCMD+K': isWithPlatformMetaKey(e) && e.code === 'KeyK',
              // Shift + / = ?
              'Shift+?': e.shiftKey && e.code === 'Slash',
            };
            return Object.values(keybindings).some(Boolean);
          }
          const eventHandler = (e: KeyboardEvent) => {
            if (
              !isTextInputLikeElement(e.target as HTMLElement) &&
              captureCommandPaletteKeybindings(e)
            ) {
              e.preventDefault();
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
