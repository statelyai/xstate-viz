import { useActor } from '@xstate/react';
import { useAppService } from './AppContext';
import { SettingsIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  BoxProps,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { ActorsPanel } from './ActorsPanel';
import { EditorPanel } from './EditorPanel';
import { useEmbed } from './embedContext';
import { EventsPanel } from './EventsPanel';
import { ResizableBox } from './ResizableBox';
import { SettingsPanel } from './SettingsPanel';
import { useSimulation } from './SimulationContext';
import { useSourceActor } from './sourceMachine';
import { SpinnerWithText } from './SpinnerWithText';
import { StatePanel } from './StatePanel';
import { EmbedMode } from './types';
import { calculatePanelIndexByPanelName } from './utils';
import { Login } from './Login';

export const PanelsView = (props: BoxProps) => {
  const embed = useEmbed();
  const appService = useAppService();
  const [state, send] = useActor(appService);
  const simService = useSimulation();
  const [sourceState, sendToSourceService] = useSourceActor();
  const activePanelIndex = useMemo(
    () => (embed?.isEmbedded ? calculatePanelIndexByPanelName(embed.panel) : 0),
    [embed],
  );

  return (
    <ResizableBox
      gridArea="panels"
      data-viz="panels"
      minHeight={0}
      {...props}
      disabled={embed?.isEmbedded && embed.mode !== EmbedMode.Full}
      hidden={embed?.isEmbedded && embed.mode === EmbedMode.Viz}
      data-testid="panels-view"
    >
      <Tabs
        bg="gray.800"
        display="grid"
        gridTemplateRows="3rem 1fr"
        height="100%"
        defaultIndex={activePanelIndex}
      >
        <TabList textTransform="uppercase">
          <Tab>Code</Tab>
          <Tab>State</Tab>
          <Tab>Events</Tab>
          <Tab>Actors</Tab>
          {!embed?.isEmbedded && (
            <Tab marginLeft="auto" marginRight="2">
              <SettingsIcon />
            </Tab>
          )}
          {embed?.isEmbedded && embed.showOriginalLink && embed.originalUrl && (
            <Button
              height="100%"
              rounded="none"
              marginLeft="auto"
              colorScheme="blue"
              as="a"
              target="_blank"
              rel="noopener noreferer nofollow"
              href={embed?.originalUrl}
              leftIcon={<ExternalLinkIcon />}
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
          {!embed?.isEmbedded && (
            <TabPanel height="100%" overflowY="auto">
              <SettingsPanel />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </ResizableBox>
  );
};
