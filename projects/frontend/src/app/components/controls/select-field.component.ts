import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatSelectModule } from '@angular/material/select';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';

export type SelectOption<T> = {
  label: string;
  value: T;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
  ],
  template: `
<mat-form-field subscriptSizing="dynamic" class="w-full">
  @if (label()) {
    <mat-label>{{ label() }}</mat-label>
  }
  <mat-select [formControl]="ctrl()" [disabled]="disabled()">
    @for (option of options(); track option.value) {
      <mat-option [value]="option.value">{{ option.label }}</mat-option>
    }
  </mat-select>
  @if (hint()) {
    <mat-hint>{{ hint() }}</mat-hint>
  }
  @if (error()) {
    <mat-error>{{ error() }}</mat-error>
  }
</mat-form-field>
  `
})
export class SelectFieldComponent<T> {
  options = input.required<SelectOption<T>[]>();

  label = input<string>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);

  ctrl = input.required<FormControl<any>>();
  ctrl$ = toObservable(this.ctrl);

  error$ = this.ctrl$.pipe(
    switchMap(ctrl => ctrl.events.pipe(
      map(() => getFormControlError(ctrl)),
    )),
  );
  error = toSignal(this.error$);
}
