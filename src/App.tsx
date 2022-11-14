import { ExternalLinkIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react';
import { useActor, useInterpret, useSelector } from '@xstate/react';
import router, { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import xstatePkgJson from 'xstate/package.json';
import { AppHead } from './AppHead';
import { useAuth } from './authContext';
import { CanvasProvider } from './CanvasContext';
import { CanvasHeader } from './CanvasHeader';
import { canvasMachine, canvasModel } from './canvasMachine';
import { CanvasView } from './CanvasView';
import { CommonAppProviders } from './CommonAppProviders';
import { EmbedProvider, useEmbed } from './embedContext';
import { isOnClientSide } from './isOnClientSide';
import { Login } from './Login';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { PanelsView } from './PanelsView';
import { registryLinks } from './registryLinks';
import { RootContainer } from './RootContainer';
import { useSimulation } from './SimulationContext';
import { getSourceActor, useSourceRegistryData } from './sourceMachine';
import { ActorsTab } from './tabs/ActorsTab';
import { CodeTab } from './tabs/CodeTab';
import { EventsTab } from './tabs/EventsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { StateTab } from './tabs/StateTab';
import { EmbedMode } from './types';
import {
  calculatePanelIndexByPanelName,
  parseEmbedQuery,
  withoutEmbedQueryParams,
} from './utils';
import { WelcomeArea } from './WelcomeArea';

const defaultHeadProps = {
  title: 'XState Visualizer',
  ogTitle: 'XState Visualizer',
  description: 'Visualizer for XState state machines and statecharts',
  // TODO - get an OG image for the home page
  ogImageUrl: null,
};

const VizHead = () => {
  const sourceRegistryData = useSourceRegistryData();

  if (!sourceRegistryData) {
    return <AppHead {...defaultHeadProps} />;
  }

  return (
    <AppHead
      title={[sourceRegistryData.project?.name, defaultHeadProps.title]
        .filter(Boolean)
        .join(' | ')}
      ogTitle={sourceRegistryData.project?.name || defaultHeadProps.ogTitle}
      description={
        sourceRegistryData.project?.name || defaultHeadProps.description
      }
      ogImageUrl={registryLinks.sourceFileOgImage(sourceRegistryData.id)}
    />
  );
};

const useReceiveMessage = (
  eventHandlers?: Record<string, (data: any) => void>,
) => {
  useEffect(() => {
    window.onmessage = async (message) => {
      const { data } = message;
      eventHandlers && eventHandlers[data.type]?.(data);
    };
  }, []);
};

function ControlsAdditionalMenu() {
  return (
    <Menu closeOnSelect={true} placement="top-end">
      <MenuButton
        as={IconButton}
        size="sm"
        isRound
        aria-label="More info"
        marginLeft="auto"
        variant="secondary"
        icon={
          <QuestionOutlineIcon
            boxSize={6}
            css={{ '& circle': { display: 'none' } }}
          />
        }
      />
      <Portal>
        <MenuList fontSize="sm" padding="0">
          <MenuItem
            as={Link}
            href="https://github.com/statelyai/xstate-viz/issues/new?template=bug_report.md"
            target="_blank"
            rel="noreferrer"
          >
            Report an issue
          </MenuItem>
          <MenuItem
            as={Link}
            href="https://github.com/statelyai/xstate"
            target="_blank"
            rel="noreferrer"
          >
            {`XState version ${xstatePkgJson.version}`}
          </MenuItem>
          <MenuItem
            as={Link}
            href="https://stately.ai/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
}

function WebApp() {
  const embed = useEmbed();
  const pannable = !embed?.isEmbedded || embed.pan;
  const zoomable = !embed?.isEmbedded || embed.zoom;

  const simService = useSimulation();
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });

  const sourceService = useSelector(useAuth(), getSourceActor);
  const [sourceState, sendToSourceService] = useActor(sourceService!);
  const sourceID = sourceState.context.sourceID;
  const canShowWelcomeMessage = sourceState.hasTag('canShowWelcomeMessage');

  const canvasService = useInterpret(canvasMachine, {
    context: {
      ...canvasModel.initialContext,
      sourceID,
      pannable,
      zoomable,
    },
  });

  useReceiveMessage({
    // used to receive messages from the iframe in embed preview
    EMBED_PARAMS_CHANGED: (data) => {
      router.replace(data.url, data.url);
    },
  });

  useEffect(() => {
    sendToSourceService({
      type: 'MACHINE_ID_CHANGED',
      id: machine?.id || '',
    });
  }, [machine?.id, sendToSourceService]);

  useEffect(() => {
    canvasService.send({
      type: 'SOURCE_CHANGED',
      id: sourceID,
    });
  }, [sourceID, canvasService]);

  const shouldRenderCanvas =
    !embed?.isEmbedded || embed.mode !== EmbedMode.Panels;
  const shouldRenderPanels = !embed?.isEmbedded || embed.mode !== EmbedMode.Viz;

  return (
    <>
      <RootContainer
        canvas={
          shouldRenderCanvas && (
            <CanvasProvider value={canvasService}>
              <CanvasView
                pannable={pannable}
                zoomable={zoomable}
                showControls={!embed?.isEmbedded || embed.controls}
                Header={
                  !embed?.isEmbedded && (
                    <Box
                      data-testid="canvas-header"
                      bg="gray.800"
                      zIndex={1}
                      padding="0"
                      height="3rem"
                    >
                      <CanvasHeader />
                    </Box>
                  )
                }
                Empty={canShowWelcomeMessage && <WelcomeArea />}
                ControlsAdditionalMenu={
                  !embed?.isEmbedded && <ControlsAdditionalMenu />
                }
              />
            </CanvasProvider>
          )
        }
        panels={
          shouldRenderPanels && (
            <PanelsView
              defaultIndex={
                embed?.isEmbedded
                  ? calculatePanelIndexByPanelName(embed.panel)
                  : 0
              }
              tabs={(() => {
                const tabs = [CodeTab, StateTab, EventsTab, ActorsTab];
                if (!embed?.isEmbedded) {
                  tabs.push(SettingsTab);
                }
                return tabs;
              })()}
              tabListRightButtons={
                !embed?.isEmbedded ? (
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
                ) : null
              }
              resizable={!embed?.isEmbedded || embed.mode === EmbedMode.Full}
            />
          )
        }
      />
      <MachineNameChooserModal />
    </>
  );
}

function App({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { query, asPath } = useRouter();
  const embed = useMemo(
    () => ({
      ...parseEmbedQuery(query),
      isEmbedded,
      originalUrl: withoutEmbedQueryParams(query),
    }),
    [query, asPath],
  );

  const paletteService = useInterpret(paletteMachine);

  return (
    <>
      <VizHead />
      {/* This is because we're doing loads of things on client side anyway */}
      {isOnClientSide() && (
        <CommonAppProviders>
          <EmbedProvider value={embed}>
            <PaletteProvider value={paletteService}>
              <WebApp />
            </PaletteProvider>
          </EmbedProvider>
        </CommonAppProviders>
      )}
    </>
  );
}

export default App;
