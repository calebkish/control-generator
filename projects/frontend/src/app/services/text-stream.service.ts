import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class TextStreamService {
  private app = inject(ApplicationRef);

  requestTextStream$(
    path: string,
    body: object
  ) {
    let isCompleted = false;
    const obs = new Observable<string>((subscriber) => {
      const abortController = new AbortController();

      fetch(`${environment.apiUrl}${path}`, {
        method: 'POST',
        signal: abortController.signal,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(async (response) => {
          const stream = response.body!;
          const decoder = new TextDecoder('utf-8');

          // Async iterator doesn't exist on ReadableStream for chrome, so
          // pipeTo a WritableStream.
          await stream.pipeTo(new WritableStream({
            write: (chunk) => {
              const decoded = decoder.decode(chunk);
              subscriber.next(decoded);
              this.app.tick();
            },
            abort: (error) => {
              console.log('in WritableStream abort', error);
              this.app.tick();
            },
            close: () => {
              isCompleted = true;
              subscriber.complete();
              this.app.tick();
            },
          }));
        })
        .catch((err) => {
          if (err instanceof DOMException) {
            console.log(`Request to "${path}" was aborted.`);
            return;
          }
          subscriber.error(err);
        });

      // will run when the observable is unsubscribed.
      return () => {
        if (!isCompleted) {
          abortController.abort();
        }
      };
    });

    return obs;
  }
}
