import { isAfter } from 'date-fns';
import { createStorage, testStorageSupport } from 'memory-web-storage';
import { ThemeName, themes } from './editor-themes';

export const storage = testStorageSupport()
  ? window.localStorage
  : createStorage();

interface InternalCodec<T> {
  __decode: Codec<T>['decode'];
  __encode: Codec<T>['encode'];
}

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

function str(): InternalCodec<string> {
  return {
    __decode: (val: unknown) => {
      if (typeof val !== 'string') {
        throw new Error();
      }
      return val;
    },
    __encode: identity,
  };
}

function num(): InternalCodec<number> {
  return {
    __decode: (val: unknown) => {
      if (typeof val !== 'number') {
        throw new Error();
      }
      return val;
    },
    __encode: identity,
  };
}

function createCodec<T>() {
  return (codec: InternalCodec<T>): Codec<T> => ({
    decode: codec.__decode,
    encode: codec.__encode,
  });
}

type UnknownShape = Record<string, InternalCodec<any>>;

type ShapeToObj<T extends UnknownShape> = {
  [K in keyof T]: ReturnType<T[K]['__decode']>;
};

function obj<S extends UnknownShape>(shape: S): InternalCodec<ShapeToObj<S>> {
  return {
    __decode: (val: unknown) => {
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
        decoded[key] = shape[key].__decode((val as any)[key]);
      }

      return decoded;
    },
    __encode: (val: ShapeToObj<S>): ShapeToObj<S> => {
      const encoded: any = {};

      for (const key of Object.keys(shape)) {
        encoded[key] = shape[key].__encode(val[key]);
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

const cachedPositionCodec = createCodec<CachedPosition>()(
  obj({
    zoom: num(),
    pan: obj({
      dx: num(),
      dy: num(),
    }),
  }),
);

const rawSourceCodec = createCodec<CachedSource>()(
  obj({
    sourceRawContent: str(),
    date: str(),
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
