import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental';
import { environment } from '../environment/environment';
import { defer } from 'rxjs';
import { AsyncPipe } from '@angular/common';

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
    <div>
      <!-- {{ text$ | async }} -->
    </div>
  </div>
</div>
@if (isDev) {
  <angular-query-devtools />
}
  `,
})
export class AppComponent {
  isDev = environment.stage === 'development';

  // text$ = defer(() => window.ipc.invoke('ping'));

  async ngOnInit() {

    // console.log('ngOnInit1');
    const reader: ReadableStreamDefaultReader = await window.ipc.invoke('ping');
    const lol = await reader.read();
    console.log(lol);
    // console.log(reader);
    // console.log('ngOnInit2');
    // console.log(stream);
    // console.log('ngOnInit3');
  }
}
