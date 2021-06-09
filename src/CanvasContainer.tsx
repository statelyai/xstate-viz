import { useMachine } from '@xstate/react';
import * as React from 'react';
import {
  Button,
  ButtonGroup,
  IconButton,
  ChakraProvider,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

import { canvasMachine, canvasModel } from './canvasMachine';
import { theme } from './theme';

export const CanvasContainer: React.FC = ({ children }) => {
  const [state, send] = useMachine(canvasMachine);

  return (
    <div
      data-panel="viz"
      onWheel={(e) => {
        send(canvasModel.events.PAN(e.deltaX, e.deltaY));
      }}
    >
      <div
        style={{
          transform: `translate(${state.context.pan.dx}px, ${state.context.pan.dy}px) scale(${state.context.zoom})`,
        }}
      >
        {children}
      </div>
      <ChakraProvider theme={theme}>
        <ButtonGroup size="sm" isAttached>
          <IconButton
            aria-label="Zoom out"
            icon={<MinusIcon />}
            onClick={() => send('ZOOM.OUT')}
          />

          <IconButton
            aria-label="Zoom in"
            icon={<AddIcon />}
            onClick={() => send('ZOOM.IN')}
          />
        </ButtonGroup>
      </ChakraProvider>
    </div>
  );
};
