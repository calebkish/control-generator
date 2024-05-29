import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class TextStreamService {
  private app = inject(ApplicationRef);
  private env = inject(EnvironmentService);

  requestTextStream$(
    path: string,
    body: object
  ) {
    let isCompleted = false;
    const obs = new Observable<string>((subscriber) => {
      const abortController = new AbortController();

      this.env.getApiUrl()
        .then((url) => {
          return fetch(`${url}${path}`, {
            method: 'POST',
            signal: abortController.signal,
            body: JSON.stringify(body),
            headers: {
              'Content-Type': 'application/json',
            }
          })
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
