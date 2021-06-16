import { useMachine } from '@xstate/react';
import React, { useContext } from 'react';
import { ButtonGroup, IconButton, ChakraProvider } from '@chakra-ui/react';
import { AddIcon, MinusIcon, RepeatIcon } from '@chakra-ui/icons';

import { canvasMachine, canvasModel } from './canvasMachine';
import { theme } from './theme';
import { SimulationContext } from './SimulationContext';

export const CanvasContainer: React.FC = ({ children }) => {
  const [state, send] = useMachine(canvasMachine);
  const simService = useContext(SimulationContext);

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

        <IconButton
          aria-label="Reset"
          icon={<RepeatIcon />}
          onClick={() => simService.send('MACHINES.RESET')}
        />
      </ChakraProvider>
    </div>
  );
};
