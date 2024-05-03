import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatInputModule } from '@angular/material/input';
import { FormFieldComponent } from "./form-field.component";

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  template: `
<mat-form-field subscriptSizing="dynamic" class="w-full">
  <mat-label>{{ label() }}</mat-label>
  <textarea
    matInput
    [formControl]="ctrl()"
    rows="4"
    [disabled]="disabled()"
  ></textarea>
  @if (hint()) {
    <mat-hint>{{ hint() }}</mat-hint>
  }
  <!-- @if (error()) {
    <mat-error>{{ error() }}</mat-error>
  } -->
</mat-form-field>
  `,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    FormFieldComponent,
    MatInputModule,
  ]
})
export class TextAreaFieldComponent {
  label = input.required<string>();
  ctrl = input.required<FormControl<any>>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  // error = formControlError(this.ctrl);
}
