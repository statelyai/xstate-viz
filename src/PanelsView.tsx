import { ExternalLinkIcon } from '@chakra-ui/icons';
import { BoxProps, Button, TabList, TabPanels, Tabs } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useEmbed } from './embedContext';
import { Login } from './Login';
import { ResizableBox } from './ResizableBox';

import { ActorsTab } from './tabs/ActorsTab';
import { CodeTab } from './tabs/CodeTab';
import { EventsTab } from './tabs/EventsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { StateTab } from './tabs/StateTab';
import { EmbedMode } from './types';
import { calculatePanelIndexByPanelName } from './utils';

export const PanelsView = (props: BoxProps) => {
  const embed = useEmbed();

  const [activePanelIndex, setActiveTabIndex] = useState(() =>
    embed?.isEmbedded ? calculatePanelIndexByPanelName(embed.panel) : 0,
  );

  useEffect(() => {
    if (embed?.isEmbedded) {
      setActiveTabIndex(calculatePanelIndexByPanelName(embed.panel));
    }
  }, [embed]);

  return (
    <ResizableBox
      {...props}
      minHeight={0}
      disabled={embed?.isEmbedded && embed.mode !== EmbedMode.Full}
      hidden={embed?.isEmbedded && embed.mode === EmbedMode.Viz}
      data-testid="panels-view"
    >
      <Tabs
        bg="gray.800"
        display="grid"
        gridTemplateRows="3rem 1fr"
        height="100%"
        index={activePanelIndex}
        onChange={(index) => {
          setActiveTabIndex(index);
        }}
      >
        <TabList>
          <CodeTab.Tab />
          <StateTab.Tab />
          <EventsTab.Tab />
          <ActorsTab.Tab />

          {!embed?.isEmbedded && <SettingsTab.Tab />}
          {!embed?.isEmbedded ? (
            <Login />
          ) : embed.showOriginalLink && embed.originalUrl ? (
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
          ) : null}
        </TabList>

        <TabPanels minHeight={0}>
          <CodeTab.TabPanel />
          <StateTab.TabPanel />
          <EventsTab.TabPanel />
          <ActorsTab.TabPanel />

          {!embed?.isEmbedded && <SettingsTab.TabPanel />}
        </TabPanels>
      </Tabs>
    </ResizableBox>
  );
};
