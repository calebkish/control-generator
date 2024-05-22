import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
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
    RouterLink,
    AsyncPipe,
  ],
  template: `
<div class="flex w-full h-full">
  <div class="p-3 bg-violet-200 h-full flex flex-col gap-2">
    <a mat-button routerLink='controls'>Controls</a>
    <a mat-button routerLink='settings'>Settings</a>
  </div>
  <div class="p-3 w-full h-full overflow-auto">
    <router-outlet />
  </div>
</div>
  `,
})
export class AppComponent {
}

/*
attribute generation:

# if no attributes exist:
- ask user to select an example control.

- user pastes in each attribute as they would like into chat input.

- select an example control.
  - example control presumably "finished" and has all its attributes?
*/
