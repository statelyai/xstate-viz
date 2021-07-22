import { isAfter, isBefore } from 'date-fns';

export interface CachedPosition {
  zoom: number;
  pan: {
    dx: number;
    dy: number;
  };
}

const POSITION_CACHE_PREFIX = `xstate_viz_position`;
const RAW_SOURCE_CACHE_PREFIX = `xstate_viz_raw_source`;

const makePositionCacheKey = (sourceID: string | null) =>
  `${POSITION_CACHE_PREFIX}|${sourceID || 'no_source'}`;

const makeRawSourceCacheKey = (sourceID: string | null) =>
  `${RAW_SOURCE_CACHE_PREFIX}|${sourceID || 'no_source'}`;

const savePosition = (sourceID: string | null, position: CachedPosition) => {
  localStorage.setItem(
    makePositionCacheKey(sourceID),
    JSON.stringify(position),
  );
};

const getPosition = (sourceID: string | null): CachedPosition | null => {
  const result = localStorage.getItem(makePositionCacheKey(sourceID));

  if (!result) return null;

  try {
    return JSON.parse(result);
  } catch (e) {}
  return null;
};

const encodeRawSource = (sourceRawContent: string, date: Date) => {
  return JSON.stringify({
    sourceRawContent,
    date,
  });
};

const decodeRawSource = (
  fromLocalStorage: string | null,
): { sourceRawContent: string; date: string } | null => {
  if (fromLocalStorage === null) return null;
  try {
    return JSON.parse(fromLocalStorage);
  } catch (e) {}
  return null;
};

const saveSourceRawContent = (
  sourceID: string | null,
  sourceRawContent: string,
) => {
  localStorage.setItem(
    makeRawSourceCacheKey(sourceID),
    encodeRawSource(sourceRawContent, new Date()),
  );
};

const getSourceRawContent = (
  sourceID: string | null,
  updatedAt: string | null,
): string | null => {
  const result = decodeRawSource(
    localStorage.getItem(makeRawSourceCacheKey(sourceID)),
  );

  if (!result) return null;

  /**
   * If there's no updatedAt date, we know the
   * stuff from localStorage is going to be freshest
   */
  if (!updatedAt) {
    return result.sourceRawContent;
  }

  const isLocalStorageFresherThanTheAPI = isAfter(
    new Date(result.date),
    new Date(updatedAt),
  );

  if (isLocalStorageFresherThanTheAPI) {
    return result.sourceRawContent;
  }
  localStorage.removeItem(makeRawSourceCacheKey(sourceID));
  return null;
};

export const localCache = {
  getPosition,
  savePosition,
  saveSourceRawContent,
  getSourceRawContent,
};
