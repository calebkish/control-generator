import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';

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
