import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { Observable, of, tap, shareReplay, finalize } from 'rxjs';

interface CacheEntry {
  body: any;
  status: number;
  timestamp: number;
}

const CACHE_PREFIX = 'gbs_http_cache_v2:';
const FRESH_TTL_MS = 60 * 1000; // 60 seconds fresh window

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Observable<any>>();

function getCacheEntry(url: string): CacheEntry | null {
  const mem = memoryCache.get(url);
  if (mem) {
    return mem;
  }

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if (raw) {
      const parsed = JSON.parse(raw) as CacheEntry;
      memoryCache.set(url, parsed);
      return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function setCacheEntry(url: string, response: HttpResponse<any>): void {
  if (!response || response.status !== 200 || response.body?.severity === 'ERROR' || response.body?.code) {
    return;
  }
  const entry: CacheEntry = {
    body: response.body,
    status: response.status,
    timestamp: Date.now()
  };
  memoryCache.set(url, entry);
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(entry));
  } catch {
    // Ignore quota errors
  }
}

function clearAllCache(): void {
  memoryCache.clear();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('gbs_http_cache_v1:') || key.startsWith(CACHE_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}

function fetchAndCache(req: HttpRequest<any>, next: HttpHandlerFn): Observable<any> {
  const url = req.urlWithParams;
  const existingInFlight = inFlightRequests.get(url);
  if (existingInFlight) {
    return existingInFlight;
  }

  const network$ = next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          setCacheEntry(url, event);
        }
      }
    }),
    finalize(() => {
      inFlightRequests.delete(url);
    }),
    shareReplay(1)
  );

  inFlightRequests.set(url, network$);
  return network$;
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            clearAllCache();
          }
        }
      })
    );
  }

  const url = req.urlWithParams;
  const cached = getCacheEntry(url);

  if (cached) {
    const cachedResponse = new HttpResponse({
      body: cached.body,
      status: cached.status,
      url
    });

    const isFresh = (Date.now() - cached.timestamp) < FRESH_TTL_MS;
    if (!isFresh) {
      // Refresh cache silently in the background while returning cached response immediately
      fetchAndCache(req, next).subscribe({ error: () => {} });
    }

    return of(cachedResponse);
  }

  return fetchAndCache(req, next);
};
