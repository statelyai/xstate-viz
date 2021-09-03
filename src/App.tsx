import { Box, ChakraProvider } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import { useAuth } from './authContext';
import { CanvasProvider } from './CanvasContext';
import { useEmbed } from './embedContext';
import { CanvasView } from './CanvasView';
import './Graph';
import { isOnClientSide } from './isOnClientSide';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { PanelsView } from './PanelsView';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { getSourceActor } from './sourceMachine';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { EmbedContext, EmbedMode } from './types';
import { useInterpretCanvas } from './useInterpretCanvas';

const getGridArea = (embed?: EmbedContext) => {
  if (embed?.isEmbedded && embed.mode === EmbedMode.Viz) {
    return 'canvas';
  }

  if (embed?.isEmbedded && embed.mode === EmbedMode.Panels) {
    return 'panels';
  }

  return 'canvas panels';
};

function App() {
  const embed = useEmbed();
  const paletteService = useInterpret(paletteMachine);
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });

  const sourceService = useSelector(useAuth(), getSourceActor);
  const [sourceState, sendToSourceService] = useActor(sourceService!);

  useEffect(() => {
    sendToSourceService({
      type: 'MACHINE_ID_CHANGED',
      id: machine?.id || '',
    });
  }, [machine?.id, sendToSourceService]);

  const sourceID = sourceState!.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
    embed,
  });

  // This is because we're doing loads of things on client side anyway
  if (!isOnClientSide()) return null;

  return (
    <ChakraProvider theme={theme}>
      <EditorThemeProvider>
        <PaletteProvider value={paletteService}>
          <SimulationProvider value={simService}>
            <Box
              data-testid="app"
              data-viz-theme="dark"
              as="main"
              display="grid"
              gridTemplateColumns="1fr auto"
              gridTemplateAreas={`"${getGridArea(embed)}"`}
              height="100vh"
            >
              {!(embed?.isEmbedded && embed.mode === EmbedMode.Panels) && (
                <CanvasProvider value={canvasService}>
                  <CanvasView />
                </CanvasProvider>
              )}
              <PanelsView />
              <MachineNameChooserModal />
            </Box>
          </SimulationProvider>
        </PaletteProvider>
      </EditorThemeProvider>
    </ChakraProvider>
  );
}

export default App;
