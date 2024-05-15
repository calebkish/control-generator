import { Component, ElementRef, input, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { getFormControlError } from '../../util/control-error';
import { MatInputModule } from '@angular/material/input';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-number-field',
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
    #numInput
    matInput
    type="number"
    [formControl]="ctrl()"
    [disabled]="disabled()"
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
export class NumberFieldComponent {
  // private matInput = viewChild.required(MatInput);
  private numInput = viewChild.required<ElementRef<HTMLInputElement>>('numInput');

  label = input.required<string>();
  disabled = input<boolean>(false);
  hint = input<string | null>(null);

  ctrl = input.required<FormControl<number | null>>();
  protected ctrl$ = toObservable(this.ctrl);

  protected error$ = this.ctrl$.pipe(
    switchMap(ctrl => ctrl.events.pipe(
      map(() => getFormControlError(ctrl)),
    )),
  );
  protected error = toSignal(this.error$);

  focus() {
    this.numInput().nativeElement.focus();
    // this.matInput()?.focus();
  }

  // ngAfterViewInit() {
  //   // this.ctrl().addValidators([])
  //   // fromEvent<InputEvent>(this.numInput().nativeElement, 'input').subscribe(event => {
  //   //   const value = event.data;
  //   //   if (value === null) {
  //   //     this.ctrl()
  //   //   }

  //   //   const num = parseInt(event.data);
  //   //   console.log();
  //   // });

  //   // console.log(this.numInput());
  //   // console.log(this.matInput());
  // }
}
