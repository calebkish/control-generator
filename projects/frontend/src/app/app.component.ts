import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

declare global {
  interface Window {
    ipc?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
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
    <!-- <a mat-button routerLink='transcribe'>Transcribe</a> -->
  </div>
  <div class="p-3 w-full h-full overflow-auto">
    <router-outlet />
  </div>
</div>
  `,
})
export class AppComponent implements OnInit {
  private snackbar = inject(MatSnackBar);

  async ngOnInit() {
    window.ipc?.on('electron-updater-update-downloaded', async () => {
      this.snackbar.open(
        'A new update has been downloaded. Please restart the app for it to take effect.',
        'Dismiss',
        { duration: 5000 }
      );
    });
  }
}
