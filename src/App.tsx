import { useMemo } from 'react';
import { useInterpret, useMachine, useSelector } from '@xstate/react';
import './Graph';
import { testMachine } from './testMachine';
import { toDirectedGraph } from './directedGraph';
import { CanvasPanel } from './CanvasPanel';
import { createSimulationMachine } from './simulationMachine';
import { SimulationProvider } from './SimulationContext';
import './base.scss';
import { EditorPanel } from './EditorPanel';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { StatePanel } from './StatePanel';
import { EventsPanel } from './EventsPanel';
import { ActorsPanel } from './ActorsPanel';
import { Login } from './Login';

import { clientMachine } from './clientMachine';
import { ClientProvider } from './clientContext';
import { sourceMachine } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';

function App() {
  const simService = useInterpret(createSimulationMachine(testMachine));
  const machine = useSelector(simService, (state) => {
    return state.context.service
      ? state.context.services[state.context.service!]?.machine
      : undefined;
  });
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );
  const clientService = useInterpret(clientMachine);
  const createdMachine = useSelector(
    clientService,
    (state) => state.context.createdMachine,
  );
  const [sourceState] = useMachine(sourceMachine);

  const isUpdateMode =
    sourceState.context.sourceProvider === 'registry' || !!createdMachine;
  const sourceID =
    sourceState.context.sourceProvider === 'registry'
      ? sourceState.context.sourceID
      : createdMachine?.id;
  const isSourceLoaded = useMemo(
    () => sourceState.matches({ with_source: 'source_loaded' }),
    [sourceState],
  );

  return (
    <SimulationProvider value={simService}>
      <Box
        data-viz="app"
        data-viz-theme="dark"
        as="main"
        display="grid"
        gridTemplateColumns="1fr minmax(50%, auto)"
        gridTemplateAreas="'canvas tabs'"
      >
        {digraph && <CanvasPanel digraph={digraph} />}
        <ClientProvider value={clientService}>
          <ChakraProvider theme={theme}>
            <Box gridArea="tabs">
              <Login />
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

                <TabPanels overflow="hidden">
                  <TabPanel padding={0}>
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
                        immediateUpdate={isSourceLoaded}
                        defaultValue={
                          isSourceLoaded
                            ? (sourceState.context.sourceRawContent as string)
                            : `import { createMachine } from 'xstate'`
                        }
                        isUpdateMode={isUpdateMode}
                        onSave={(code: string) => {
                          if (isUpdateMode) {
                            clientService.send({
                              type: 'UPDATE',
                              id: sourceID,
                              rawSource: code,
                            });
                          } else {
                            clientService.send({
                              type: 'SAVE',
                              rawSource: code,
                            });
                          }
                        }}
                        onChange={(machines) => {
                          simService.send({
                            type: 'MACHINES.VERIFY',
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
            </Box>
          </ChakraProvider>
        </ClientProvider>
      </Box>
    </SimulationProvider>
  );
}

export default App;
