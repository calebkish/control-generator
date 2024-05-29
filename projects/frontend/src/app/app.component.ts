import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatSnackBar, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';
import { SettingsService, latestTos } from './services/settings.service';
import { toSignal } from '@angular/core/rxjs-interop';

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
  @if (hasAcceptedTermsOfService()) {
    <div class="p-3 bg-violet-200 h-full flex flex-col gap-2">
      <a mat-button routerLink='controls'>Controls</a>
      <a mat-button routerLink='settings'>Settings</a>
      <!-- <a mat-button routerLink='transcribe'>Transcribe</a> -->
    </div>
    <div class="p-3 w-full h-full overflow-auto">
      <router-outlet />
    </div>
  } @else {
    <div class="p-6 h-full w-full flex flex-col gap-2">
      <div class="whitespace-pre-wrap overflow-auto">{{ latestTos }}</div>
      <button type="button" class="flex-shrink-0" mat-flat-button (click)="acceptTos()">Accept Terms of Service</button>
    </div>
  }
</div>
  `,
})
export class AppComponent implements OnInit {
  private readonly snackbar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);

  hasAcceptedTermsOfService = toSignal(this.settingsService.hasAcceptedTermsOfSerivce$, { initialValue: true });
  latestTos = latestTos.tos;

  acceptTos() {
    this.settingsService.acceptTos$.next();
  }

  async ngOnInit() {
    window.ipc?.on('electron-updater-update-downloaded', () => {
      console.log('update-downloaded')
      this.snackbar.openFromComponent(RestartSnackComponent, { duration: 10000 });
    });

    window.ipc?.on('electron-updater-download-progress', (progress) => {
      console.log('download-progress:', progress);
    });

    window.ipc?.on('electron-updater-checking-for-update', () => {
      console.log('checking-for-update');
    });

    window.ipc?.on('electron-updater-update-not-availabe', () => {
      console.log('update-not-available');
    });

    window.ipc?.on('electron-updater-update-available', () => {
      console.log('update-available');
      this.snackbar.open('A new update is available! Please keep the application open while it\'s downloaded.', 'Dismiss', { duration: 10000 });
    });


    await window.ipc?.invoke('check-for-updates');
  }
}

