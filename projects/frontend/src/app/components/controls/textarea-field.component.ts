import { Component, input, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, SubscriptSizing } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatInput, MatInputModule } from '@angular/material/input';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  template: `
<mat-form-field [subscriptSizing]="this.subscriptSizing()" class="w-full">
  <mat-label>{{ label() }}</mat-label>
  <textarea
    matInput
    [formControl]="ctrl()"
    [rows]="rows()"
    [disabled]="disabled()"
  ></textarea>
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
  ]
})
export class TextAreaFieldComponent {
  private matInput = viewChild.required(MatInput);

  label = input.required<string>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  rows = input<number>(4);
  subscriptSizing = input<SubscriptSizing>('dynamic');

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
