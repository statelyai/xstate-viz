import { createStorage, testStorageSupport } from 'memory-web-storage';
import { Event, PropertyDict } from 'mixpanel';
import { SHA3 } from 'sha3';

// Naive way of creating a UUID for users who don't have access to the crypto API
function preCryptoGenerateUUID() {
  const d = new Date();
  const k = d.getTime();
  const str = k.toString(16).slice(1);
  const UUID = 'xxxx-xxxx-4xxx-yxxx-xzx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 3) | 8;
    return v.toString(16);
  });
  return UUID.replace(/z/, str);
}

const debounce = <T extends (...args: any[]) => ReturnType<T>>(
  callback: T,
  timeout: number,
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
    }, timeout);
  };
};

export type AnalyticsEvent = Event | string;

let hashedUserId: SHA3<512> | undefined = undefined;
let currentConsentGiven: boolean | undefined = undefined;

const storage = testStorageSupport() ? window.localStorage : createStorage();

const getRandomUniqueId = () => {
  const uniqueId = storage.getItem('random.uuid');
  if (uniqueId) return uniqueId;
  const newUniqueId = preCryptoGenerateUUID();
  storage.setItem('random.uuid', newUniqueId);
  return newUniqueId;
};

/*
 * This is used to get a distinc, and anonymous user id.
 * It's either based on a hash of the user's identity or a random id.
 */
export const getDistinctAnonUserId = () => {
  if (hashedUserId && currentConsentGiven === true) {
    return hashedUserId.digest('hex');
  }

  // If the user has not given consent, return a reusable random id
  return getRandomUniqueId();
};

let batchedEvents: Event[] = [];

// This acts as a proxy for Mixpanel which we're consuming in our analyze.ts API file.
const sendEvents = () => {
  if (batchedEvents.length === 0) return;

  // Add the current user id to the events
  const eventsToSend = batchedEvents.map((event) => ({
    event: event.event,
    properties: { ...event.properties, distinct_id: getDistinctAnonUserId() },
  }));

  // Reset the batched events
  batchedEvents = [];

  // We only care about analytics events in the production env, so we hardcode the analytics URL here.
  // This will also fix events from the VS Code extension not being delivered to https://file+.vscode-resource.vscode-cdn.net/registry/api/analyze.
  fetch('https://stately.ai/registry/api/analyze', {
    method: 'POST',
    body: JSON.stringify(eventsToSend),
  }).catch(console.log);
};

// Debounce the sending of events to avoid sending too many at the same time.
const debouncedSendEvents =
  typeof window !== 'undefined'
    ? debounce(sendEvents, 1000)
    : () => {
        /*noop*/
      };

// Batch the current event and add a timestamp
const batchEvent = (
  eventName: string,
  properties?: PropertyDict,
  { instantDelivery = false } = {},
) => {
  const unixTimestamp = Math.floor(new Date().getTime() / 1000);
  batchedEvents.push({
    event: eventName,
    properties: { ...properties, time: unixTimestamp },
  });
  if (instantDelivery) {
    sendEvents();
  } else {
    debouncedSendEvents();
  }
};

const debouncedTrack =
  typeof window !== 'undefined'
    ? debounce(batchEvent, 1000)
    : () => {
        /*noop*/
      };

const analyticsInstance = {
  /** Set the identity of the currently logged in user */
  identify: (id: string) => {
    hashedUserId = new SHA3().update(id);
  },
  /** Sets the consent status of the current user */
  hasGivenConsent: (consentGiven: boolean) => {
    currentConsentGiven = consentGiven;
  },
  /** Track an event which will be sent to our analytics */
  track: batchEvent,
  /** Use this if you expect to send a lot of events at once and only care about some of them, this will debounce the events and send after 1 second. */
  debouncedTrack,
};

// currently required to use `typeof` as the `extends`' target:
// https://github.com/microsoft/TypeScript/issues/31843
type Identity<T> = T;

export interface AnalyticsInstance extends Identity<typeof analyticsInstance> {}

/**
 * Use this to send / proxy analytics events to Mixpanel.
 * We track route changes and the user identity in _app.tsx.
 * So use this for tracking custom events with the returned track function.
 */
export const analytics = (): AnalyticsInstance | undefined => {
  if (
    !process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ||
    typeof window === 'undefined'
  ) {
    return;
  }
  return analyticsInstance;
};

// Function that returns a unique ID that is 5 characters long
// without using storage or cookies
export function getShortUniqueId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}
