import { BoxProps, TabList, TabPanels, Tabs } from '@chakra-ui/react';
import React from 'react';
import { ResizableBox } from './ResizableBox';

export const PanelsView = ({
  defaultIndex = 0,
  resizable = true,
  tabs,
  tabListRightButtons,
  ...props
}: BoxProps & {
  defaultIndex?: number;
  resizable?: boolean;
  tabs: Array<{
    Tab: React.ComponentType;
    TabPanel: React.ComponentType;
  }>;
  tabListRightButtons: React.ReactNode;
}) => {
  return (
    <ResizableBox
      {...props}
      minHeight={0}
      disabled={resizable}
      data-testid="panels-view"
    >
      <Tabs
        bg="gray.800"
        display="grid"
        gridTemplateRows="3rem 1fr"
        height="100%"
        defaultIndex={defaultIndex}
      >
        <TabList>
          {tabs.map(({ Tab }, index) => (
            <Tab key={index} />
          ))}
          {tabListRightButtons}
        </TabList>

        <TabPanels minHeight={0}>
          {tabs.map(({ TabPanel }, index) => (
            <TabPanel key={index} />
          ))}
        </TabPanels>
      </Tabs>
    </ResizableBox>
  );
};
