import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatSnackBar, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'restart-snack',
  standalone: true,
  imports: [
    MatButton,
    MatSnackBarAction,
    MatSnackBarActions,
    MatSnackBarLabel,
  ],
  template: `
<div class="flex">
  <div matSnackBarLabel>
    A new update has been downloaded. Please restart the app for it to take effect.
  </div>
  <div matSnackBarActions class="flex">
    <button type="button" matSnackBarAction mat-button (click)="restart()">Restart</button>
    <button type="button" matSnackBarAction mat-button (click)="dismiss()">Dismiss</button>
  </div>
</div>
  `,
})
export class RestartSnackComponent {
  private snackbarRef = inject(MatSnackBarRef);

  async restart() {
    await window.ipc?.invoke('quit-and-install');
    this.snackbarRef.dismissWithAction();
  }

  dismiss() {
    this.snackbarRef.dismissWithAction();
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
      this.snackbar.openFromComponent(RestartSnackComponent, { duration: 10000 });
    });

    window.ipc?.on('download-progress', async (progress) => {
      console.log('progress:', progress);
    });

    const updateCheckResult = await window.ipc?.invoke('check-for-updates');
    if (updateCheckResult) {
      this.snackbar.open('A new update is available! Please keep the application open while it\'s downloaded.', 'Dismiss', { duration: 10000 });
    }
  }
}
