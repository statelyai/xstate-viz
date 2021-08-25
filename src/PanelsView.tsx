import { SettingsIcon } from '@chakra-ui/icons';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
} from '@chakra-ui/react';
import React from 'react';
import { ActorsPanel } from './ActorsPanel';
import { useAuth } from './authContext';
import { EditorPanel } from './EditorPanel';
import { useEmbed } from './embedContext';
import { EventsPanel } from './EventsPanel';
import { ExternalIcon } from './ExternalIcon';
import { Login } from './Login';
import { ResizableBox } from './ResizableBox';
import { SettingsPanel } from './SettingsPanel';
import { useSimulation } from './SimulationContext';
import { useSourceActor } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';

export const PanelsView = () => {
  const embed = useEmbed();
  const simService = useSimulation();
  const authService = useAuth();
  const [sourceState, sendToSourceService] = useSourceActor(authService);

  return (
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
        defaultIndex={embed.panelIndex}
      >
        <TabList>
          <Tab>Code</Tab>
          <Tab>State</Tab>
          <Tab>Events</Tab>
          <Tab>Actors</Tab>
          <Tab marginLeft="auto" marginRight="2" hidden={embed.isEmbedded}>
            <SettingsIcon />
          </Tab>
          <Login hidden={embed.isEmbedded} />
          {embed.isEmbedded && embed.showOriginalLink && embed.embedUrl && (
            <Button
              height="100%"
              rounded="none"
              marginLeft="auto"
              colorScheme="blue"
              as="a"
              target="_blank"
              rel="noopener noreferer nofollow"
              href={embed.embedUrl}
              leftIcon={<ExternalIcon />}
            >
              Open in Stately.ai/viz
            </Button>
          )}
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
          <TabPanel height="100%" overflowY="auto" hidden={embed.isEmbedded}>
            <SettingsPanel />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ResizableBox>
  );
};
