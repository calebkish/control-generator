import { Component, Signal, TemplateRef, computed, contentChild, input } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { formControlError } from '../../util/control-error';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  template: `
<mat-form-field subscriptSizing="dynamic">
  <mat-label>{{ label() }}</mat-label>
  <!-- <ng-container *ngTemplateOutlet="template(); context: context()" /> -->
  <input matInput [formControl]="ctrl()" />
  <!-- <textarea
    matInput
    [formControl]="ctrl()"
    rows="4"
    [disabled]="disabled()"
  ></textarea> -->
  @if (hint()) {
    <mat-hint>{{ hint() }}</mat-hint>
  }
  @if (error()) {
    <mat-error>{{ error() }}</mat-error>
  }
</mat-form-field>
  `
})
export class TextFieldComponent {
  label = input.required<string>();
  ctrl = input.required<FormControl<any>>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  error = formControlError(this.ctrl);
}
