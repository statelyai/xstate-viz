import { useInterpret } from '@xstate/react';
import { useEffect } from 'react';
import { canvasMachine } from './canvasMachine';
import './Graph';
import { localCache } from './localCache';

export const useInterpretCanvas = ({
  sourceID,
}: {
  sourceID: string | null;
}) => {
  const canvasService = useInterpret(canvasMachine, {
    actions: {
      persistPositionToLocalStorage: (context) => {
        const { zoom, pan } = context;
        localCache.savePosition(sourceID, { zoom, pan });
      },
    },
  });

  useEffect(() => {
    canvasService.send({
      type: 'SOURCE_CHANGED',
      id: sourceID,
    });
  }, [sourceID, canvasService]);

  return canvasService;
};
