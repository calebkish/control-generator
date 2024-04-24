import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { formControlError } from '../../util/control-error';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
<mat-form-field subscriptSizing="dynamic">
  <mat-label>{{ label() }}</mat-label>
  <mat-select [formControl]="ctrl()">
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
  label = input.required<string>();
  ctrl = input.required<FormControl<any>>();
  options = input.required<SelectOption<T>[]>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  error = formControlError(this.ctrl);
}
