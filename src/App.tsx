import { useActor, useInterpret, useSelector } from '@xstate/react';
import router, { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { AppHead } from './AppHead';
import { useAuth } from './authContext';
import { CanvasProvider } from './CanvasContext';
import { CanvasView } from './CanvasView';
import { CommonAppProviders } from './CommonAppProviders';
import { EmbedProvider, useEmbed } from './embedContext';
import { isOnClientSide } from './isOnClientSide';
import { MachineNameChooserModal } from './MachineNameChooserModal';
import { PaletteProvider } from './PaletteContext';
import { paletteMachine } from './paletteMachine';
import { PanelsView } from './PanelsView';
import { registryLinks } from './registryLinks';
import { RootContainer } from './RootContainer';
import { useSimulation } from './SimulationContext';
import { getSourceActor, useSourceRegistryData } from './sourceMachine';
import { EmbedMode } from './types';
import { useInterpretCanvas } from './useInterpretCanvas';
import { parseEmbedQuery, withoutEmbedQueryParams } from './utils';

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
      title={[sourceRegistryData.system?.name, defaultHeadProps.title]
        .filter(Boolean)
        .join(' | ')}
      ogTitle={sourceRegistryData.system?.name || defaultHeadProps.ogTitle}
      description={
        sourceRegistryData.system?.name || defaultHeadProps.description
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

function WebApp() {
  const embed = useEmbed();
  const simService = useSimulation();
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });

  const sourceService = useSelector(useAuth(), getSourceActor);
  const [sourceState, sendToSourceService] = useActor(sourceService!);
  const sourceID = sourceState!.context.sourceID;

  const canvasService = useInterpretCanvas({
    sourceID,
    embed,
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
              <CanvasView />
            </CanvasProvider>
          )
        }
        panels={<PanelsView />}
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
