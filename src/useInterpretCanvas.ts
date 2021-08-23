import { useInterpret } from '@xstate/react';
import { useEffect } from 'react';
import { canvasMachine } from './canvasMachine';
import './Graph';
import { localCache } from './localCache';
import { EmbedContext } from './types';

export const useInterpretCanvas = ({
  sourceID,
  embed,
}: {
  sourceID: string | null;
  embed: EmbedContext;
}) => {
  const canvasService = useInterpret(canvasMachine, {
    guards: {
      isEmbeddedMode: () => embed.isEmbedded,
    },
    actions: {
      persistPositionToLocalStorage: (context) => {
        localCache.savePosition(sourceID, context);
      },
    },
  });
  useEffect(() => {
    canvasService.onTransition(console.log);
  }, []);

  useEffect(() => {
    canvasService.send({
      type: 'SOURCE_CHANGED',
      id: sourceID,
    });
  }, [sourceID, canvasService]);

  return canvasService;
};
