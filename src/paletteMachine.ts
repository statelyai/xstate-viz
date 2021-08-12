import { createModel } from 'xstate/lib/model';
import { EDITOR_CLASSNAME } from './constants';

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
              'CtrlCMD+K': (e.metaKey || e.ctrlKey) && e.code === 'KeyK',
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
      // Chakra needs to close the Modal on press of ESC but having a Menu inside Modal breaks that
      // TODO: Fix this in Chakra layer
      invoke: {
        src: () => (sendBack) => {
          const handler = (e: KeyboardEvent) => {
            if (e.code === 'Escape') {
              sendBack('HIDE_PALETTE');
            }
          };
          window.addEventListener('keydown', handler);
          return () => {
            window.removeEventListener('keydown', handler);
          };
        },
      },
      on: {
        HIDE_PALETTE: 'closed',
      },
    },
  },
});
