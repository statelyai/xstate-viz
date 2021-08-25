import { isAfter } from 'date-fns';
import { createStorage, testStorageSupport } from 'memory-web-storage';
import { ThemeName, themes } from './editor-themes';

export const storage = testStorageSupport()
  ? window.localStorage
  : createStorage();

interface Codec<T> {
  /**
   * this tries to match **parsed** value to the expected type
   */
  decode: (val: unknown) => T;
  /**
   * as encoded values are coming from the app we can trust our types
   * this is used mainly to purify the value, pick only required keys and so on
   */
  encode: (val: T) => T;
}

function identity<T>(a: T): T {
  return a;
}

function str(): Codec<string> {
  return {
    decode: (val: unknown) => {
      if (typeof val !== 'string') {
        throw new Error();
      }
      return val;
    },
    encode: identity,
  };
}

function num(): Codec<number> {
  return {
    decode: (val: unknown) => {
      if (typeof val !== 'number') {
        throw new Error();
      }
      return val;
    },
    encode: identity,
  };
}

type UnknownShape = Record<string, Codec<any>>;

type ShapeToObj<T extends UnknownShape> = {
  [K in keyof T]: ReturnType<T[K]['decode']>;
};

function obj<S extends UnknownShape>(shape: S): Codec<ShapeToObj<S>> {
  return {
    decode: (val: unknown) => {
      if (typeof val !== 'object') {
        throw new Error(`Input value is not an object.`);
      }
      if (val === null) {
        throw new Error(`Input value is \`null\`.`);
      }

      const decoded: any = {};

      for (const key of Object.keys(shape)) {
        if (!(key in val)) {
          throw new Error(
            `Key "${key}" is missing in the expected shape of \`{${Object.keys(
              shape,
            ).join(', ')}}\``,
          );
        }
        decoded[key] = shape[key].decode((val as any)[key]);
      }

      return decoded;
    },
    encode: (val: ShapeToObj<S>): ShapeToObj<S> => {
      const encoded: any = {};

      for (const key of Object.keys(shape)) {
        encoded[key] = shape[key].encode(val[key]);
      }

      return encoded;
    },
  };
}

export interface CachedPosition {
  zoom: number;
  pan: {
    dx: number;
    dy: number;
  };
}

export interface CachedSource {
  sourceRawContent: string;
  date: string;
}

const POSITION_CACHE_PREFIX = `xstate_viz_position`;
const RAW_SOURCE_CACHE_PREFIX = `xstate_viz_raw_source`;
const EDITOR_THEME_CACHE_KEY = `xstate_viz_editor_theme`;

const makePositionCacheKey = (sourceID: string | null) =>
  `${POSITION_CACHE_PREFIX}|${sourceID || 'no_source'}`;

const makeRawSourceCacheKey = (sourceID: string | null) =>
  `${RAW_SOURCE_CACHE_PREFIX}|${sourceID || 'no_source'}`;

const cachedPositionCodec = obj({
  zoom: num(),
  pan: obj({
    dx: num(),
    dy: num(),
  }),
});

const rawSourceCoded = obj({
  sourceRawContent: str(),
  date: str(),
});

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
      rawSourceCoded.encode({
        sourceRawContent,
        date: new Date().toJSON(),
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

  let result: ReturnType<typeof rawSourceCoded.decode>;

  try {
    result = rawSourceCoded.decode(cached);
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
    new Date(result.date),
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
