import { Component, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpControlsService } from '../services/http-controls.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TextFieldComponent } from '../components/controls/text-field.component';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AsyncPipe } from '@angular/common';
import { Control } from '@http';
import { ControlFormPageComponent } from './control-form-page.component';

@Component({
  selector: 'app-controls-page',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    TextFieldComponent,
    AsyncPipe,
    ControlFormPageComponent,
    MatIconButton,
  ],
  template: `
<div class="w-full max-w-3xl h-full mx-auto flex flex-col gap-3">

  <div class="flex gap-2 justify-center">
    <app-text-field label="Name" [ctrl]="nameCtrl" class="w-72" subscriptSizing="fixed" />
    <button mat-flat-button (click)="addControl$.next()" class="mt-1">
      <mat-icon>add</mat-icon>
      Create a control
    </button>
  </div>

  <div class="text-4xl font-bold">Controls</div>

  <div class="flex flex-col max-w-3xl overflow-auto">
    @for (control of controls$ | async; track control; let last = $last) {
      <div class="flex justify-between items-center p-3">
        <a [routerLink]="['form', control.id]" class="">
          {{ control.name }}
        </a>
        <button type="button" mat-icon-button aria-label="Delete control" class="icon-button-error" (click)="deleteControl$.next(control.id)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
      @if (!last) {
        <hr class="border-violet-200" />
      }
    }
  </div>

</div>
  `,
})
export class ControlsPageComponent {
  private controlsService = inject(HttpControlsService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(MatSnackBar);

  nameField = viewChild.required(TextFieldComponent);

  addControl$ = new Subject<void>();
  deleteControl$ = new Subject<number>();

  nameCtrl = this.fb.control<string>('', controlNameValidators);

  controls$ = this.controlsService.controls$;
  controls = toSignal(this.controls$, { initialValue: [] });

  constructor() {
    this.addControl$
      .pipe(takeUntilDestroyed())
      .subscribe(async () => {
        if (!this.nameCtrl.valid) {
          this.nameCtrl.markAsTouched();
          this.nameCtrl.updateValueAndValidity();
          this.nameField().focus();
          this.snackbar.open('Please enter a valid name', 'Dismiss', { duration: 3000, panelClass: 'snackbar-error' });
          return;
        }
        const name = this.nameCtrl.value;
        await firstValueFrom(this.controlsService.createControl(name));
        this.controlsService.fetchControlsRequest$.next();
        this.nameCtrl.reset();
      });

    this.deleteControl$
      .pipe(takeUntilDestroyed())
      .subscribe(async (id) => {
        await firstValueFrom(this.controlsService.deleteControl(id));
        this.controlsService.fetchControlsRequest$.next();
      });
  }

}

export const controlNameValidators = [Validators.required, Validators.minLength(4)];
