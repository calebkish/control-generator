import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental';
import { environment } from '../environment/environment';
import { Observable, ReadableStreamLike, Subject, defer, from, scan, switchMap, takeUntil, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { TextStreamService } from './services/text-stream.service';

declare global {
  interface Window {
    ipc: {
      invoke: (channel: string, ...args: any[]) => any;
      on: (channel: string, handler: (...args: any[]) => Promise<any>) => () => void;
    }
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    AngularQueryDevtools,
    RouterLink,
    AsyncPipe,
  ],
  template: `
<div class="flex w-full h-full">
  <div class="p-3 bg-violet-200 h-full">
    <a mat-button routerLink='controls'>Controls</a>
  </div>
  <div class="p-3 w-full h-full overflow-auto">
    <router-outlet />
  </div>
</div>
@if (isDev) {
  <angular-query-devtools />
}
  `,
})
export class AppComponent {
  isDev = environment.stage === 'development';
  textStreamService = inject(TextStreamService);

  // generateSuggestion$ = new Subject<void>();
  // cancel$ = new Subject<void>();

  // text$ = this.generateSuggestion$.pipe(
  //   switchMap(() => {
  //     return this.textStreamService.requestTextStream$('http://localhost:4200/api/llm')
  //       .pipe(
  //         scan<string, string>((acc, value) => acc + value, ''),
  //         takeUntil(this.cancel$),
  //       );
  //   }),
  // );
  // text = toSignal(this.text$, { initialValue: '' });

}

/*
attribute generation:

# if no attributes exist:
- ask user to select an example control.

- user pastes in each attribute as they would like into chat input.

- select an example control.
  - example control presumably "finished" and has all its attributes?

-

- llm will be fed:
  - control form
  - control description
  - example control
  - user attribute recommendations
*/
