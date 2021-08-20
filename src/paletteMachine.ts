import { createModel } from 'xstate/lib/model';
import { EDITOR_CLASSNAME } from './constants';
import { isWithPlatformMetaKey } from './utils';

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
          function eventRoseFromEditor(e: KeyboardEvent) {
            const editorElement = document.querySelector(EDITOR_CLASSNAME);
            return editorElement && editorElement.contains(e.target as Node);
          }
          const eventHandler = (e: KeyboardEvent) => {
            if (
              captureCommandPaletteKeybindings(e) &&
              !eventRoseFromEditor(e)
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
