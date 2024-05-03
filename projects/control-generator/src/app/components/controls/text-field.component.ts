import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatInputModule } from '@angular/material/input';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, switchMap, tap } from 'rxjs';
import { adapt } from '@state-adapt/angular';
import { toSource } from '@state-adapt/rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    AsyncPipe,
  ],
  template: `
<mat-form-field subscriptSizing="dynamic" class="w-full">
  <mat-label>{{ label() }}</mat-label>
  <input
    matInput
    [formControl]="ctrl()"
    [disabled]="disabled()"
  />
  @if (hint()) {
    <mat-hint>{{ hint() }}</mat-hint>
  }
  @if (error$ | async; as error) {
    <mat-error>{{ error }}</mat-error>
  }
  <!-- @if (!ctrl().invalid && ctrl().touched && ctrl().hasError('required')) {
    <mat-error>REQUIRED</mat-error>
  } -->
</mat-form-field>
  `
})
export class TextFieldComponent {
  label = input.required<string>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);

  ctrl = input.required<FormControl<any>>();
  ctrl$ = toObservable(this.ctrl);

  error$ = this.ctrl$.pipe(
    switchMap(ctrl => ctrl.statusChanges.pipe(
      tap((status) => console.log('status change', status)),
      map(() => getFormControlError(ctrl)),
      // startWith(getFormControlError(ctrl)),
    )),
    tap((error) => console.log('error', error)),
  );
  error = toSignal(this.error$);

  constructor() {
    this.ctrl$
      .pipe(
        switchMap(ctrl => ctrl.statusChanges),
      )
      .subscribe((status) => console.log('status', status));

  }

  ngOnInit() {
    // setInterval(() => {
    //   console.log(this.label(), this.ctrl().valid);
    // }, 500);
  }
}
