import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const cache = new Map<string, HttpResponse<any>>();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req).pipe(
      tap({
        next: () => {
          cache.clear();
        }
      })
    );
  }

  const cachedResponse = cache.get(req.urlWithParams);

  return new Observable(subscriber => {
    if (cachedResponse) {
      subscriber.next(cachedResponse);
    }

    const subscription = next(req).subscribe({
      next: (event) => {
        if (event instanceof HttpResponse) {
          cache.set(req.urlWithParams, event);
          subscriber.next(event);
        }
      },
      error: (error) => subscriber.error(error),
      complete: () => subscriber.complete()
    });

    return () => subscription.unsubscribe();
  });
};
