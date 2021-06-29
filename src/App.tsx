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
import { gistMachine } from './gistMachine';
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
  const clientService = useInterpret(clientMachine).start();
  const [gistState] = useMachine(gistMachine);

  return (
    <SimulationProvider value={simService}>
      <main data-viz="app" data-viz-theme="dark">
        {digraph && <CanvasPanel digraph={digraph} />}
        <ClientProvider value={clientService}>
          <ChakraProvider theme={theme}>
            <Box>
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

                <TabPanels overflowY="auto">
                  <TabPanel padding={0}>
                    {gistState.matches({ with_gist: 'loading_content' }) && (
                      <SpinnerWithText text="Loading from gist" />
                    )}
                    {!gistState.matches({ with_gist: 'loading_content' }) && (
                      <EditorPanel
                        defaultValue={
                          gistState.matches({ with_gist: 'gist_loaded' })
                            ? (gistState.context.gistRawContent as string)
                            : '// some comment'
                        }
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
                  <TabPanel>
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
      </main>
    </SimulationProvider>
  );
}

export default App;
