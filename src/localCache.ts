import { isAfter } from 'date-fns';
import { createStorage, testStorageSupport } from 'memory-web-storage';
import { ThemeName, themes } from './editor-themes';
import * as codec from './codec';

export const storage = testStorageSupport()
  ? window.localStorage
  : createStorage();

export interface CachedPosition {
  zoom: number;
  pan: {
    dx: number;
    dy: number;
  };
}

export interface CachedSource {
  sourceRawContent: string;
  date: Date;
}

const POSITION_CACHE_PREFIX = `xstate_viz_position`;
const RAW_SOURCE_CACHE_PREFIX = `xstate_viz_raw_source`;
const EDITOR_THEME_CACHE_KEY = `xstate_viz_editor_theme`;

const makePositionCacheKey = (sourceID: string | null) =>
  `${POSITION_CACHE_PREFIX}|${sourceID || 'no_source'}`;

const makeRawSourceCacheKey = (sourceID: string | null) =>
  `${RAW_SOURCE_CACHE_PREFIX}|${sourceID || 'no_source'}`;

const cachedPositionCodec = codec.createCodec<CachedPosition>()(
  codec.obj({
    zoom: codec.num(),
    pan: codec.obj({
      dx: codec.num(),
      dy: codec.num(),
    }),
  }),
);

const rawSourceCodec = codec.createCodec<
  CachedSource,
  {
    sourceRawContent: string;
    date: string;
  }
>()(
  codec.obj({
    sourceRawContent: codec.str(),
    date: codec.date(),
  }),
);

const savePosition = (sourceID: string | null, position: CachedPosition) => {
  storage.setItem(
    makePositionCacheKey(sourceID),
    JSON.stringify(cachedPositionCodec.encode(position)),
  );
};

const getPosition = (sourceID: string | null): CachedPosition | null => {
  const result = storage.getItem(makePositionCacheKey(sourceID));

  if (!result) return null;

  try {
    return cachedPositionCodec.decode(JSON.parse(result));
  } catch (e) {}
  return null;
};

const saveSourceRawContent = (
  sourceID: string | null,
  sourceRawContent: string,
) => {
  storage.setItem(
    makeRawSourceCacheKey(sourceID),
    JSON.stringify(
      rawSourceCodec.encode({
        sourceRawContent,
        date: new Date(),
      }),
    ),
  );
};

const removeSourceRawContent = (sourceID: string | null) => {
  storage.removeItem(makeRawSourceCacheKey(sourceID));
};

const getSourceRawContent = (
  sourceID: string | null,
  updatedAt: string | null,
): string | null => {
  const cached = storage.getItem(makeRawSourceCacheKey(sourceID));

  if (!cached) {
    return null;
  }

  let result: CachedSource;

  try {
    result = rawSourceCodec.decode(JSON.parse(cached));
  } catch (err) {
    storage.removeItem(makeRawSourceCacheKey(sourceID));
    console.log('Could not decode cached source', err);
    return null;
  }

  /**
   * If there's no updatedAt date, we know the
   * stuff from localStorage is going to be freshest
   */
  if (!updatedAt) {
    return result.sourceRawContent;
  }

  const isLocalStorageFresherThanTheAPI = isAfter(
    result.date,
    new Date(updatedAt),
  );

  if (isLocalStorageFresherThanTheAPI) {
    return result.sourceRawContent;
  }
  storage.removeItem(makeRawSourceCacheKey(sourceID));
  return null;
};

const getEditorTheme = (): ThemeName | null => {
  try {
    const themeName = storage.getItem(EDITOR_THEME_CACHE_KEY);
    let parsedTheme = null;
    if (themeName) {
      const parsed = JSON.parse(themeName) as ThemeName;
      if (themes[parsed]) {
        parsedTheme = parsed;
      }
    }
    return parsedTheme;
  } catch (e) {
    return null;
  }
};

const saveEditorTheme = (themeName: ThemeName) => {
  try {
    storage.setItem(EDITOR_THEME_CACHE_KEY, JSON.stringify(themeName));
  } catch (er) {}
};

export const localCache = {
  getPosition,
  savePosition,
  saveSourceRawContent,
  getSourceRawContent,
  getEditorTheme,
  saveEditorTheme,
  removeSourceRawContent,
};
