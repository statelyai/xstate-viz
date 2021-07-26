import {
  Box,
  ChakraProvider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useInterpret, useSelector } from '@xstate/react';
import { useMemo } from 'react';
import { ActorsPanel } from './ActorsPanel';
import { AuthProvider } from './authContext';
import { authMachine } from './authMachine';
import './base.scss';
import { CanvasProvider } from './CanvasContext';
import { CanvasPanel } from './CanvasPanel';
import { toDirectedGraph } from './directedGraph';
import { EditorPanel } from './EditorPanel';
import { EventsPanel } from './EventsPanel';
import { Footer } from './Footer';
import './Graph';
import { Login } from './Login';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { ResizableBox } from './ResizableBox';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { useSourceActor } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';
import { theme } from './theme';
import { useInterpretCanvas } from './useInterpretCanvas';

const initialMachineCode = `
import { createMachine } from 'xstate';
`.trim();

function App() {
  const simService = useInterpret(simulationMachine);
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );
  const authService = useInterpret(authMachine);
  const sourceService = useSelector(
    authService,
    (state) => state.context.sourceRef,
  );

  const [sourceState, sendToSourceService] = useSourceActor(authService);

  const sourceID = sourceState.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
  });

  return (
    <SimulationProvider value={simService}>
      <AuthProvider value={authService}>
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
          {digraph ? (
            <CanvasProvider value={canvasService}>
              <CanvasPanel digraph={digraph} />
            </CanvasProvider>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center">
              <Text textAlign="center">
                No machines to display yet...
                <br />
                Create one!
              </Text>
            </Box>
          )}
          <ChakraProvider theme={theme}>
            <ResizableBox gridArea="panels">
              <Login />
              <MachineNameChooserModal />
              <Tabs
                bg="gray.800"
                display="grid"
                gridTemplateRows="auto 1fr"
                height="100%"
              >
                <TabList>
                  <Tab>Code</Tab>
                  <Tab>State</Tab>
                  <Tab>Events</Tab>
                  <Tab>Actors</Tab>
                </TabList>

                <TabPanels minHeight={0}>
                  <TabPanel padding={0} height="100%">
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
                        immediateUpdate={Boolean(
                          sourceState.context.sourceRawContent,
                        )}
                        defaultValue={
                          sourceState.context.sourceRawContent ||
                          initialMachineCode
                        }
                        onChangedCodeValue={(code) => {
                          sendToSourceService({
                            type: 'CODE_UPDATED',
                            code,
                            sourceID: sourceState.context.sourceID,
                          });
                        }}
                        onSave={(code: string) => {
                          sendToSourceService({
                            type: 'SAVE',
                            rawSource: code,
                          });
                        }}
                        onCreateNew={(code) => {
                          sendToSourceService({
                            type: 'CREATE_NEW',
                            rawSource: code,
                          });
                        }}
                        onChange={(machines) => {
                          simService.send({
                            type: 'MACHINES.REGISTER',
                            machines,
                          });
                        }}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    <StatePanel />
                  </TabPanel>
                  <TabPanel overflow="hidden" height="100%">
                    <EventsPanel />
                  </TabPanel>
                  <TabPanel>
                    <ActorsPanel />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ResizableBox>
            <Footer />
          </ChakraProvider>
        </Box>
      </AuthProvider>
    </SimulationProvider>
  );
}

export default App;
