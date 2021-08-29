import { SettingsIcon } from '@chakra-ui/icons';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import { ActorsPanel } from './ActorsPanel';
import { useAppService } from './appContext';
import { EditorPanel } from './EditorPanel';
import { EventsPanel } from './EventsPanel';
import { ResizableBox } from './ResizableBox';
import { SettingsPanel } from './SettingsPanel';
import { useSimulation } from './SimulationContext';
import { useSourceActor } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';

export const PanelsView = () => {
  const appService = useAppService();
  const simService = useSimulation();
  const [sourceState, sendToSourceService] = useSourceActor();
  const isCollapsed = useSelector(appService, (state) =>
    state.matches({ panels: 'collapsed' }),
  );

  return (
    <ResizableBox
      gridArea="panels"
      minHeight={0}
      position={isCollapsed ? 'absolute' : undefined}
      transition="all .3s"
      sx={
        isCollapsed
          ? {
              right: 0,
              bottom: 0,
              transform: 'translateX(100%)',
            }
          : undefined
      }
    >
      <Tabs
        bg="gray.800"
        display="grid"
        gridTemplateRows="3rem 1fr"
        height="100%"
      >
        <TabList textTransform="uppercase">
          <Tab>Code</Tab>
          <Tab>State</Tab>
          <Tab>Events</Tab>
          <Tab>Actors</Tab>
          <Tab marginLeft="auto" marginRight="2">
            <SettingsIcon />
          </Tab>
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
  );
};
