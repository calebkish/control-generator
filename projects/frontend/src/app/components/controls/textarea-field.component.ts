import { Component, input, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, SubscriptSizing } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatInput, MatInputModule } from '@angular/material/input';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  template: `
<mat-form-field [subscriptSizing]="this.subscriptSizing()" class="w-full">
  @if (label(); as label) {
    <mat-label>{{ label }}</mat-label>
  }
  @if (placeholder(); as placeholder) {
    <textarea
      matInput
      cdkTextareaAutosize
      [formControl]="ctrl()"
      [disabled]="disabled()"
      [placeholder]="placeholder"
    ></textarea>
  } @else {
    <textarea
      matInput
      cdkTextareaAutosize
      [formControl]="ctrl()"
      [disabled]="disabled()"
    ></textarea>
  }
  @if (hint()) {
    <mat-hint>{{ hint() }}</mat-hint>
  }
  @if (error()) {
    <mat-error>{{ error() }}</mat-error>
  }
</mat-form-field>
  `,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    CdkTextareaAutosize,
  ]
})
export class TextAreaFieldComponent {
  private matInput = viewChild.required(MatInput);

  label = input<string>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  subscriptSizing = input<SubscriptSizing>('dynamic');
  placeholder= input<string>();

  ctrl = input.required<FormControl<any>>();
  ctrl$ = toObservable(this.ctrl);

  error$ = this.ctrl$.pipe(
    switchMap(ctrl => ctrl.events.pipe(
      map(() => getFormControlError(ctrl)),
    )),
  );
  error = toSignal(this.error$);

  focus() {
    this.matInput().focus();
  }
}
