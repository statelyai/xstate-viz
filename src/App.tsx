import { SettingsIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ChakraProvider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { useInterpret, useSelector } from '@xstate/react';
import React, { useEffect, useMemo } from 'react';
import { ActorsPanel } from './ActorsPanel';
import { AuthProvider } from './authContext';
import { authMachine } from './authMachine';
import { CanvasProvider } from './CanvasContext';
import { CanvasPanel } from './CanvasPanel';
import { EditorPanel } from './EditorPanel';
import { useEmbed } from './embedContext';
import { EventsPanel } from './EventsPanel';
import './Graph';
import { Login } from './Login';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { ResizableBox } from './ResizableBox';
import { SettingsPanel } from './SettingsPanel';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { useSourceActor } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';
import { theme } from './theme';
import { EditorThemeProvider } from './themeContext';
import { EmbedPanel } from './types';
import { useInterpretCanvas } from './useInterpretCanvas';
import { Visibility } from './Visibility';

const App: React.FC = () => {
  const embed = useEmbed();
  const paletteService = useInterpret(paletteMachine);
  // don't use `devTools: true` here as it would freeze your browser
  const simService = useInterpret(simulationMachine);
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const authService = useInterpret(authMachine);

  const [sourceState, sendToSourceService] = useSourceActor(authService);

  useEffect(() => {
    sendToSourceService({
      type: 'MACHINE_ID_CHANGED',
      id: machine?.id || '',
    });
  }, [machine?.id, sendToSourceService]);

  const sourceID = sourceState.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
  });

  return (
    <ChakraProvider theme={theme}>
      <EditorThemeProvider>
        <AuthProvider value={authService}>
          <PaletteProvider value={paletteService}>
            <SimulationProvider value={simService}>
              <Box
                data-testid="app"
                data-viz-theme="dark"
                as="main"
                display="grid"
                gridTemplateColumns="1fr auto"
                gridTemplateRows="1fr auto"
                gridTemplateAreas="'canvas panels' 'footer footer'"
                height="100vh"
              >
                <Visibility
                  isHidden={embed.isEmbedded && embed.mode === 'panels'}
                >
                  <CanvasProvider value={canvasService}>
                    <CanvasPanel />
                  </CanvasProvider>
                </Visibility>

                <ResizableBox
                  gridArea="panels"
                  minHeight={0}
                  hidden={embed.isEmbedded && embed.mode === 'viz'}
                >
                  <Tabs
                    bg="gray.800"
                    display="grid"
                    gridTemplateRows="3rem 1fr"
                    height="100%"
                    index={embed.panelIndex}
                  >
                    <TabList>
                      <Tab aria-selected={embed.panel === EmbedPanel.Code}>
                        Code
                      </Tab>
                      <Tab
                        isSelected={true}
                        aria-selected={embed.panel === EmbedPanel.State}
                      >
                        State
                      </Tab>
                      <Tab aria-selected={embed.panel === EmbedPanel.Events}>
                        Events
                      </Tab>
                      <Tab aria-selected={embed.panel === EmbedPanel.Actors}>
                        Actors
                      </Tab>
                      <Tab
                        hidden={embed.isEmbedded}
                        aria-selected={embed.panel === EmbedPanel.Settings}
                        marginLeft="auto"
                        marginRight="2"
                      >
                        <SettingsIcon />
                      </Tab>
                      <Login hidden={embed.isEmbedded} />
                      {/* {embed.isEmbedded && <Button as="link" href={`https://stately.ai/viz` + router.asPath}>Open in Stately.ai/viz</Button>} */}
                    </TabList>

                    <TabPanels minHeight={0}>
                      <TabPanel height="100%" padding={0}>
                        {sourceState.matches({
                          with_source: 'loading_content',
                        }) && (
                          <SpinnerWithText
                            text={`Loading source from ${sourceState.context.sourceProvider}`}
                          />
                        )}
                        {!sourceState.matches({
                          with_source: 'loading_content',
                        }) && (
                          <EditorPanel
                            onChangedCodeValue={(code) => {
                              sendToSourceService({
                                type: 'CODE_UPDATED',
                                code,
                                sourceID: sourceState.context.sourceID,
                              });
                            }}
                            onCreateNew={() =>
                              sendToSourceService({
                                type: 'CREATE_NEW',
                              })
                            }
                            onSave={() => {
                              sendToSourceService({
                                type: 'SAVE',
                              });
                            }}
                            onChange={(machines) => {
                              simService.send({
                                type: 'MACHINES.REGISTER',
                                machines,
                              });
                            }}
                            onFork={() => {
                              sendToSourceService({
                                type: 'FORK',
                              });
                            }}
                          />
                        )}
                      </TabPanel>
                      <TabPanel height="100%" overflowY="auto">
                        <StatePanel />
                      </TabPanel>
                      <TabPanel height="100%" overflow="hidden">
                        <EventsPanel />
                      </TabPanel>
                      <TabPanel height="100%" overflowY="auto">
                        <ActorsPanel />
                      </TabPanel>
                      <TabPanel height="100%" overflowY="auto">
                        <SettingsPanel />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </ResizableBox>
                <MachineNameChooserModal />
              </Box>
            </SimulationProvider>
          </PaletteProvider>
        </AuthProvider>
      </EditorThemeProvider>
    </ChakraProvider>
  );
};

export default App;
