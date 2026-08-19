const MAX_CONCURRENT_IMAGE_REQUESTS = 6;
const MAX_CACHED_IMAGES = 180;
const MAX_TRANSIENT_RETRIES = 2;

interface QueueEntry {
  url: string;
  status: 'queued' | 'loading' | 'loaded';
  priority: number;
  sequence: number;
  consumers: Set<symbol>;
  controller?: AbortController;
  objectUrl?: string;
  resolve: (objectUrl: string) => void;
  reject: (error: unknown) => void;
  promise: Promise<string>;
  retryCount: number;
}

export interface ImageRequest {
  promise: Promise<string>;
  cancel: () => void;
}

const entries = new Map<string, QueueEntry>();
let activeRequests = 0;
let sequence = 0;

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

const isTransientStatus = (status: number): boolean =>
  status === 408 || status === 425 || status === 429 || status >= 500;

const trimCache = () => {
  const loadedEntries = Array.from(entries.values())
    .filter(entry => entry.status === 'loaded' && entry.objectUrl && entry.consumers.size === 0)
    .sort((a, b) => a.sequence - b.sequence);

  while (loadedEntries.length > MAX_CACHED_IMAGES) {
    const entry = loadedEntries.shift();
    if (!entry) break;
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    entries.delete(entry.url);
  }
};

const pump = () => {
  while (activeRequests < MAX_CONCURRENT_IMAGE_REQUESTS) {
    const next = Array.from(entries.values())
      .filter(entry => entry.status === 'queued' && entry.consumers.size > 0)
      .sort((a, b) => a.priority - b.priority || a.sequence - b.sequence)[0];

    if (!next) break;
    void startEntry(next);
  }
};

const startEntry = async (entry: QueueEntry) => {
  entry.status = 'loading';
  activeRequests += 1;
  const controller = new AbortController();
  entry.controller = controller;

  try {
    const response = await fetch(entry.url, {
      signal: controller.signal,
      cache: 'force-cache',
      headers: { Accept: 'image/avif,image/webp,image/png,image/*;q=0.8' },
    });

    if (!response.ok) {
      const error = new Error(`Image request failed: ${response.status}`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const blob = await response.blob();
    if (controller.signal.aborted || entry.consumers.size === 0) return;

    entry.objectUrl = URL.createObjectURL(blob);
    entry.status = 'loaded';
    entry.sequence = ++sequence;
    entry.resolve(entry.objectUrl);
    trimCache();
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const canRetry = !controller.signal.aborted
      && entry.consumers.size > 0
      && entry.retryCount < MAX_TRANSIENT_RETRIES
      && (status === undefined || isTransientStatus(status));

    if (controller.signal.aborted || entry.consumers.size === 0) {
      if (entries.get(entry.url) === entry) entries.delete(entry.url);
    } else if (canRetry) {
      entry.retryCount += 1;
      entry.status = 'queued';
      entry.priority -= 0.5;
      window.setTimeout(() => {
        if (entries.get(entry.url) === entry && entry.consumers.size > 0) pump();
      }, 350 * entry.retryCount);
    } else if (!isAbortError(error)) {
      entries.delete(entry.url);
      entry.reject(error);
    }
  } finally {
    activeRequests -= 1;
    entry.controller = undefined;
    pump();
  }
};

export const requestImage = (url: string, priority = 0): ImageRequest => {
  let entry = entries.get(url);

  if (!entry) {
    let resolve!: (objectUrl: string) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<string>((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });

    entry = {
      url,
      status: 'queued',
      priority,
      sequence: ++sequence,
      consumers: new Set(),
      resolve,
      reject,
      promise,
      retryCount: 0,
    };
    entries.set(url, entry);
  } else {
    entry.priority = Math.min(entry.priority, priority);
  }

  const consumer = Symbol(url);
  entry.consumers.add(consumer);
  pump();

  let cancelled = false;
  return {
    promise: entry.promise,
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      entry?.consumers.delete(consumer);

      if (!entry || entry.consumers.size > 0) return;

      if (entry.status === 'queued') {
        entries.delete(entry.url);
        entry.reject(new DOMException('Image request cancelled', 'AbortError'));
      } else if (entry.status === 'loading') {
        entry.controller?.abort();
      }
    },
  };
};

export const getCachedImageObjectUrl = (url: string): string | null => {
  const entry = entries.get(url);
  return entry?.status === 'loaded' ? entry.objectUrl ?? null : null;
};

export const getImageRequestStats = () => ({
  active: activeRequests,
  queued: Array.from(entries.values()).filter(entry => entry.status === 'queued').length,
  cached: Array.from(entries.values()).filter(entry => entry.status === 'loaded').length,
  maxConcurrent: MAX_CONCURRENT_IMAGE_REQUESTS,
});
