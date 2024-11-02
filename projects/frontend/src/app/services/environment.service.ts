import { Injectable } from '@angular/core';
import { Observable, defer, from, shareReplay, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  async getApiUrl() {
    const apiPort = await window.ipc?.invoke('get-api-port');
    return apiPort ? `http://localhost:${apiPort}/api` : 'http://localhost:3000/api'
  }

  apiUrl$ = defer(() => {
    return from(this.getApiUrl())
  }).pipe(
    shareReplay(1),
  );

  withApiUrl$<T>(obsFactory: (url: string) => Observable<T>): Observable<T> {
    return this.apiUrl$.pipe(
      switchMap(url => obsFactory(url)),
    );
  }
}
