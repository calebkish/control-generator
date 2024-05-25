import { Component, computed, inject, input } from '@angular/core';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatMiniFabButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-array-field',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatMiniFabButton,
  ],
  template: `
  <div class="rounded-md flex flex-col gap-4">
    <div class="flex flex-col gap-8">
      @for (control of arrayControls(); track control; let idx = $index) {
        <div class="flex gap-2">
          <mat-form-field subscriptSizing="dynamic" class="w-full">
            <textarea matInput [formControl]="control" [rows]="this.rows()"></textarea>
          </mat-form-field>
          <button type="button" mat-icon-button (click)="controlArrayRemove$.next(idx)" class="button-error">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      }
    </div>

    <button type="button" mat-button (click)="controlArrayAdd$.next()">
      Add
      <mat-icon>add</mat-icon>
    </button>
  </div>
  `,
  styles: ``
})
export class ArrayFieldComponent<T> {
  fb = inject(NonNullableFormBuilder);

  arrayCtrl = input.required<FormArray<FormControl<T>>>();
  defaultValue = input.required<T>();
  label = input.required<string>();
  rows = input<number>(10);

  arrayControls = computed(() => {
    const arrayCtrl = this.arrayCtrl();
    return arrayCtrl.controls;
  });

  controlArrayAdd$ = new Subject<void>();
  controlArrayRemove$ = new Subject<number>();

  constructor() {
    this.controlArrayAdd$.pipe(
      takeUntilDestroyed(),
    ).subscribe(() => {
      const newControl = this.fb.control<T>(this.defaultValue());
      this.arrayCtrl().push(newControl);
    });

    this.controlArrayRemove$.pipe(
      takeUntilDestroyed(),
    ).subscribe((i) => {
      this.arrayCtrl().removeAt(i);
    });
  }

  add(value?: T) {
    const newControl = this.fb.control<T>(value ?? this.defaultValue());
    this.arrayCtrl().push(newControl);
  }
}
