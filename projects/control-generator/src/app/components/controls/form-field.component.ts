import { Component, Signal, TemplateRef, computed, contentChild, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { formControlError } from '../../util/control-error';
import { CommonModule } from '@angular/common';


/* Usage:

<app-form-field [label]="label()" [ctrl]="ctrl()">
  <ng-template let-ctrl="formControl">
    <textarea
      matInput
      [formControl]="ctrl"
      rows="4"
      [disabled]="disabled()"
    ></textarea>
  </ng-template>
</app-form-field>

Doesn't really work. MatFormField will throw an error saying it must contain a
control, even tho one is provided through the template.
*/

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  template: `
@if (template()) {
  <mat-form-field subscriptSizing="dynamic">
    <mat-label>{{ label() }}</mat-label>
    <ng-container *ngTemplateOutlet="template(); context: context()" />
    @if (hint()) {
      <mat-hint>{{ hint() }}</mat-hint>
    }
    @if (error()) {
      <mat-error>{{ error() }}</mat-error>
    }
  </mat-form-field>
}
  `
})
export class FormFieldComponent {
  template = contentChild.required<TemplateRef<FormFieldContext>>(TemplateRef);

  label = input.required<string>();
  ctrl = input.required<FormControl<any>>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  error = formControlError(this.ctrl);

  context: Signal<FormFieldContext> = computed(() => {
    const ctrl = this.ctrl();
    return {
      formControl: ctrl,
    };
  });
  // template = input.required<TemplateRef<FormFieldContext>>();
}

type FormFieldContext = {
  formControl: FormControl<any>;
};
