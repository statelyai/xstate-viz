import { SourceProvider } from './types';

export interface CachedPosition {
  zoom: number;
  pan: {
    dx: number;
    dy: number;
  };
}

const POSITION_CACHE_PREFIX = `xstate_viz_position`;

const makePositionCacheKey = (sourceId: string) =>
  `${POSITION_CACHE_PREFIX}${sourceId}`;

const savePosition = (sourceId: string, position: CachedPosition) => {
  localStorage.setItem(
    makePositionCacheKey(sourceId),
    JSON.stringify(position),
  );
};

const getPosition = (sourceId: string): CachedPosition | null => {
  const result = localStorage.getItem(makePositionCacheKey(sourceId));

  if (!result) return null;

  try {
    return JSON.parse(result);
  } catch (e) {}
  return null;
};

export const localCache = {
  getPosition,
  savePosition,
};
