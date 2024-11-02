import { Component, effect, input, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, SubscriptSizing } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatInput, MatInputModule } from '@angular/material/input';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';
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
<mat-form-field [subscriptSizing]="subscriptSizing()" class="w-full">
  @if (label()) {
    <mat-label>{{ label() }}</mat-label>
  }
  <input
    matInput
    [formControl]="ctrl()"
  />
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
  private matInput = viewChild.required(MatInput);

  label = input<string>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);
  subscriptSizing = input<SubscriptSizing>('dynamic');

  ctrl = input.required<FormControl<any>>();
  protected ctrl$ = toObservable(this.ctrl);

  protected error$ = this.ctrl$.pipe(
    switchMap(ctrl => ctrl.events.pipe(
      map(() => getFormControlError(ctrl)),
    )),
  );
  protected error = toSignal(this.error$);

  constructor() {
    toObservable(this.disabled).pipe(
      takeUntilDestroyed()
    ).subscribe(disabled => {
      const ctrl = this.ctrl();
      if (disabled && !ctrl.disabled) {
        ctrl.disable();
      } else if (!disabled && !ctrl.enabled) {
        ctrl.enable();
      }
    });
  }

  focus() {
    this.matInput().focus();
  }
}
