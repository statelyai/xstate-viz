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
import { EditorPanel, SourceStatus } from './EditorPanel';
import { EventsPanel } from './EventsPanel';
import './Graph';
import { Login } from './Login';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { ResizableBox } from './ResizableBox';
import { SimulationProvider } from './SimulationContext';
import { simulationMachine } from './simulationMachine';
import { useSourceState } from './sourceMachine';
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
  const createdMachine = useSelector(
    authService,
    (state) => state.context.createdMachine,
  );

  const [sourceState, sendToSourceService] = useSourceState(authService);

  const sourceID =
    sourceState.context.sourceProvider === 'registry'
      ? sourceState.context.sourceID
      : createdMachine?.id;

  let sourceStatus: SourceStatus = 'no-source';

  if (!sourceState.matches('no_source')) {
    if (
      sourceState.context.loggedInUserId ===
      sourceState.context.sourceRegistryData?.owner?.id
    ) {
      sourceStatus = 'user-owns-source';
    } else {
      sourceStatus = 'user-does-not-own-source';
    }
  }

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
          gridTemplateAreas="'canvas tabs'"
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
            <ResizableBox gridArea="tabs">
              <Login />
              <MachineNameChooserModal />
              <Tabs
                bg="gray.800"
                display="grid"
                gridTemplateRows="auto 1fr"
                height="100vh"
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
                        sourceStatus={sourceStatus}
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
          </ChakraProvider>
        </Box>
      </AuthProvider>
    </SimulationProvider>
  );
}

export default App;
