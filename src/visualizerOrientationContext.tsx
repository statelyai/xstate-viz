import { Box } from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';
import { EmbedContext, EmbedMode } from './types';
import { createRequiredContext } from './utils';

export type OrientationType = 'top/bottom' | 'left/right' | 'full';

const [VizOrientationProviderLocal, useVizOrientation] = createRequiredContext<{
  orientation: OrientationType;
  changeOrientation(orientation: OrientationType): void;
}>('VisualizerOrientation');

export function VizOrientationProvider({
  children,
  embed,
}: {
  children: React.ReactNode;
  embed: EmbedContext;
}) {
  const VIZ_LOCAL_KEY = 'xstate_viz_editor_orientation';
  const vizLocalOrientation: OrientationType = window.localStorage.getItem(
    VIZ_LOCAL_KEY,
  ) as OrientationType;
  const [orientation, setOrientation] = useState<OrientationType>(
    vizLocalOrientation ?? 'left/right',
  );
  const contextValue = useMemo(
    () => ({ orientation, changeOrientation: setOrientation }),
    [orientation],
  );

  React.useEffect(() => {
    window.localStorage.setItem(VIZ_LOCAL_KEY, orientation);
  }, [orientation]);

  const getGridArea = (embed?: EmbedContext) => {
    if (orientation === 'top/bottom') {
      return '';
    }

    if (embed?.isEmbedded && embed.mode === EmbedMode.Viz) {
      return 'canvas';
    }

    if (embed?.isEmbedded && embed.mode === EmbedMode.Panels) {
      return 'panels';
    }

    return 'canvas panels';
  };

  return (
    <VizOrientationProviderLocal value={contextValue}>
      <Box
        data-testid="app"
        data-viz-theme="dark"
        as="main"
        display="grid"
        gridTemplateColumns={
          orientation === 'top/bottom' ? 'repeat(1, 1fr)' : '1fr auto'
        }
        gridTemplateRows={
          orientation === 'top/bottom' ? 'repeat(2, 1fr)' : '1fr auto'
        }
        gridTemplateAreas={`"${getGridArea(embed)}"`}
        height="100vh"
      >
        {children}
      </Box>
    </VizOrientationProviderLocal>
  );
}
export { useVizOrientation };
